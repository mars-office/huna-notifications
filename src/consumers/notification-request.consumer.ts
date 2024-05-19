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
          const now = new Date().toString();
          if (!context.originalMessage.properties.headers) {
            context.originalMessage.properties.headers = {};
          }
          const notificationsCollection =
            db.collection<NotificationEntity>("notifications");

          // DB
          let notification: NotificationEntity | null;

          if (!(context.headers! as any).insertedInDb) {
            notification = {
              createdAt: now,
              issuedAt: context.sentTime!,
              message: context.message.message,
              title: context.message.title,
              requestId: context.messageId!,
              severity: context.message.severity,
              userEmail: context.message.toUserEmail,
              data: context.message.data
            };
            const insertResult = await notificationsCollection.insertOne(
              notification
            );
            notification._id = insertResult.insertedId;
            (context.originalMessage.properties.headers as any).insertedInDb = 'yes';
          } else {
            notification = await notificationsCollection.findOne({requestId: context.messageId!});
          }

          if (!notification) {
            console.error(`Notification cannot be inserted in the database or was not found. MessageId: ${context.messageId}`);
            return;
          }

          const dto: NotificationDto = {
            _id: notification._id!.toString(),
            issuedAt: notification.issuedAt,
            message: notification.message,
            severity: notification.severity,
            title: notification.title,
            readAt: notification.readAt,
            data: notification.data
          };

          // SignalR
          if (context.message.deliveryTypes.includes("signalr") && !(context.headers as any).signalrSent) {
            await signalrSendEndpoint.send<
              SendSignalrMessageRequest<NotificationDto>
            >({
              payload: dto,
              receiverType: "user",
              to: notification.userEmail,
            });
            (context.originalMessage.properties.headers as any).signalrSent = 'yes';
          }

          // Push
          if (context.message.deliveryTypes.includes("push") && !(context.headers as any).pushSent) {
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
                const sendPushResult = await sendPushNotification(ps.json, dto);
                if (sendPushResult.statusCode === 404) {
                  idsToDelete.push(ps._id);
                }
              } catch (err: any) {
                console.error('Error on push', err);
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
                console.error('Error on delete expired pushSubscription', err);
              }
            }
            (context.originalMessage.properties.headers as any).pushSent = 'yes';
          }

          // Email
          if (context.message.deliveryTypes.includes("email") && !(context.headers as any).emailSent) {
            const url = process.env.UI_URL! + '/fromNotification/' + dto._id!;
            const body = `${context.message.message}<br /><br /><a href="${url}">${url}</a>`;
            await sendEmail(context.message.toUserEmail, context.message.title, body);
            (context.originalMessage.properties.headers as any).emailSent = 'yes';
          }
        }
      );
    },
    {
      maxRetries: 5,
    }
  );
};
export default startNotificationRequestConsumer;
