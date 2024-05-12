import { MessageType } from "masstransit-rabbitmq/dist/messageType";
import { NotificationRequest } from "../contracts/notification-request";
import bus from "../services/rabbitmq.service";

export const registerNotificationRequestConsumer = () => {
  bus.receiveEndpoint('notifications', endpoint => {
    endpoint.handle<NotificationRequest>(new MessageType("NotificationRequest", "Huna.Notifications"), async context => {
      console.log("Received: " + JSON.stringify(context.message));
    });
  });
}

export default registerNotificationRequestConsumer;