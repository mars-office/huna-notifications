import { NotificationRequest } from "../contracts/notification-request";
import bus from "../services/masstransit.service";
import { MessageType } from "masstransit-rabbitmq/dist/messageType";
import db from "../services/mongodb.service";
import { NotificationEntity } from "../entities/notification.entity";
import { NotificationDto } from "../contracts/notification.dto";
import { SendSignalrMessageRequest } from "../contracts/send-signalr-message-request";
import { PushSubscriptionEntity } from "../entities/push-subscription.entity";
import sendPushNotification from "../services/web-push.service";
import { ObjectId } from "mongodb";
import sendEmail from "../services/mail.service";

export const startNotificationRequestConsumer = () => {
  const signalrSendMessageRequestMessageType = new MessageType(
    "SendSignalrMessageRequest",
    "Huna.Signalr.Contracts"
  );
  const signalrSendEndpoint = bus.sendEndpoint({
    durable: true,
    exchange: signalrSendMessageRequestMessageType.toExchange(),
    exchangeType: "fanout",
    messageType: signalrSendMessageRequestMessageType,
  });

  bus.asyncReceiveEndpoint(
    "huna-notifications",
    (endpoint) => {
      endpoint.handle<NotificationRequest>(
        new MessageType("NotificationRequest", "Huna.Notifications.Contracts"),
        async (context) => {
          console.log(`Received message id ${context.messageId}`);
          const now = new Date().toString();
          if (!context.originalMessage.properties.headers) {
            context.originalMessage.properties.headers = {};
          }

          // Validation
          if (
            !context.message.toUserEmail ||
            context.message.toUserEmail === "" ||
            !context.message.title ||
            context.message.title === "" ||
            !context.message.message ||
            context.message.message === ""
          ) {
            console.error(
              "Request rejected permanently as it failed basic validation: " +
                context.messageId
            );
            return;
          }

          // DB
          const notificationsCollection =
            db.collection<NotificationEntity>("notifications");

          let notification: NotificationEntity | null;

          if (!(context.headers! as any).insertedInDb) {
            console.log(
              `Inserting notification for request id ${context.messageId} into database`
            );
            notification = {
              createdAt: now,
              issuedAt: context.sentTime!,
              message: context.message.message,
              title: context.message.title,
              requestId: context.messageId!,
              severity: context.message.severity || "info",
              userEmail: context.message.toUserEmail,
              data: context.message.data,
              url: context.message.url,
            };
            const insertResult = await notificationsCollection.insertOne(
              notification
            );
            console.log("Inserted");
            notification._id = insertResult.insertedId;
            (context.originalMessage.properties.headers as any).insertedInDb =
              "yes";
          } else {
            console.log("Notification already present in DB");
            notification = await notificationsCollection.findOne({
              requestId: context.messageId!,
            });
          }

          if (!notification) {
            console.error(
              `Notification cannot be inserted in the database or was not found. MessageId: ${context.messageId}`
            );
            return;
          }

          const dto: NotificationDto = {
            _id: notification._id!.toString(),
            issuedAt: notification.issuedAt,
            message: notification.message,
            severity: notification.severity,
            title: notification.title,
            readAt: notification.readAt,
            data: notification.data,
            url: notification.url,
          };

          console.log(`Notification ID: ` + dto._id);

          // SignalR
          if (
            context.message.deliveryTypes.includes("signalr") &&
            !(context.headers as any).signalrSent
          ) {
            console.log(`Sending SignalR notification ${dto._id}`);
            await signalrSendEndpoint.send<SendSignalrMessageRequest>({
              message: {
                type: "Huna.Notifications.Contracts.NotificationDto",
                payload: dto,
              },
              receiverType: "user",
              to: notification.userEmail,
            });
            console.log(`Sent.`);
            (context.originalMessage.properties.headers as any).signalrSent =
              "yes";
          }

          // Push
          if (
            context.message.deliveryTypes.includes("push") &&
            !(context.headers as any).pushSent
          ) {
            console.log(`Sending push notification ${dto._id}`);
            const pushSubscriptionsCollection =
              db.collection<PushSubscriptionEntity>("pushSubscriptions");
            const lastFivePushSubscriptionsForUser =
              await pushSubscriptionsCollection
                .find(
                  {
                    userEmail: context.message.toUserEmail,
                  },
                  {
                    limit: 5,
                    sort: {
                      createdAtTs: -1,
                    },
                  }
                )
                .toArray();
            const idsToDelete: ObjectId[] = [];
            for (let ps of lastFivePushSubscriptionsForUser) {
              try {
                const pushDto: NotificationDto = {
                  issuedAt: dto.issuedAt,
                  message: dto.message,
                  data: dto.data,
                  url: dto.url ? process.env.UI_URL! + '/fromNotification/' + dto._id! + '?returnTo=' + encodeURIComponent(dto.url) : undefined,
                  severity: dto.severity,
                  title: dto.title,
                  _id: dto._id,
                  readAt: dto.readAt,
                };
                const sendPushResult = await sendPushNotification(
                  ps.json,
                  pushDto
                );
                if (sendPushResult.statusCode === 404) {
                  idsToDelete.push(ps._id);
                }
              } catch (err: any) {
                console.error("Error on push", err);
                if (err.statusCode && err.statusCode === 404) {
                  idsToDelete.push(ps._id);
                }
              }
            }
            for (let idToDelete of idsToDelete) {
              try {
                await pushSubscriptionsCollection.deleteOne({
                  _id: idToDelete,
                });
              } catch (err: any) {
                // ignored
                console.error("Error on delete expired pushSubscription", err);
              }
            }
            console.log("Sent");
            (context.originalMessage.properties.headers as any).pushSent =
              "yes";
          }

          // Email
          if (
            context.message.deliveryTypes.includes("email") &&
            !(context.headers as any).emailSent
          ) {
            console.log(`Sending email notification ${dto._id}`);

            let body = `${context.message.message}`;
            if (dto.url) {
              const url =
                process.env.UI_URL! +
                "/fromNotification/" +
                dto._id! +
                "?returnTo=" +
                encodeURIComponent(dto.url!);
              body = body + `<br /><br /><a href="${url}">${url}</a>`;
            }
            const reply = await sendEmail(
              context.message.toUserEmail,
              context.message.title,
              body
            );
            if (reply.response.status !== 200) {
              throw new Error("Email sending failed");
            }
            console.log("Sent");
            (context.originalMessage.properties.headers as any).emailSent =
              "yes";
          }

          console.log(
            "Request id " + context.messageId + " finished processing"
          );
        }
      );
    },
    {
      maxRetries: 5,
    }
  );
};
export default startNotificationRequestConsumer;
