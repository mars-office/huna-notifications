import { NotificationRequest } from "../contracts/notification-request";
import bus from "../services/masstransit.service";
import { MessageType } from "masstransit-rabbitmq/dist/messageType";
import db from "../services/mongodb.service";
import { NotificationEntity } from "../entities/notification.entity";
import { NotificationDto } from "../contracts/notification.dto";
import { SendSignalrMessageRequest } from "../contracts/send-signalr-message-request";

export const startNotificationRequestConsumer = () => {
  const signalrSendMessageRequestMessageType = new MessageType('SendSignalrMessageRequest', 'Huna.Signalr.Contracts');
  const signalrSendEndpoint = bus.sendEndpoint({
    durable: true,
    exchange: signalrSendMessageRequestMessageType.toExchange(),
    exchangeType: 'fanout',
    messageType: signalrSendMessageRequestMessageType
  });

  bus.asyncReceiveEndpoint("huna-notifications", (endpoint) => {
    endpoint.handle<NotificationRequest>(
      new MessageType("NotificationRequest", "Huna.Notifications.Contracts"),
      async (context) => {
        const now = new Date().toString();
        const notificationsCollection = db.collection<NotificationEntity>("notifications");

        // DB
        let notification: NotificationEntity | null = await notificationsCollection.findOne({requestId: context.messageId!});
        if (!notification) {
          notification = {
            createdAt: now,
            issuedAt: context.sentTime!,
            message: context.message.message,
            title: context.message.title,
            requestId: context.messageId!,
            severity: context.message.severity,
            userEmail: context.message.toUserEmail,
          };
          const insertResult = await notificationsCollection.insertOne(notification);
          notification._id = insertResult.insertedId;
        }

        const dto: NotificationDto = {
          _id: notification._id!.toString(),
          issuedAt: notification.issuedAt,
          message: notification.message,
          severity: notification.severity,
          title: notification.title,
          readAt: notification.readAt
        };
        
        // SignalR
        if (context.message.deliveryTypes.includes('signalr')) {
          await signalrSendEndpoint.send<SendSignalrMessageRequest<NotificationDto>>({
            payload: dto,
            receiverType: 'user',
            to: notification.userEmail
          });
        }

        // Push
        if (context.message.deliveryTypes.includes('push')) {
          
        }

        // Email
        if (context.message.deliveryTypes.includes('email')) {


        }

      }
    );
  }, {
    maxRetries: 5,
  });
};
export default startNotificationRequestConsumer;
