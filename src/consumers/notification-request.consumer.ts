import { NotificationRequest } from "../contracts/notification-request";
import bus from "../services/masstransit.service";
import { MessageType } from "masstransit-rabbitmq/dist/messageType";

export const startNotificationRequestConsumer = () => {
  bus.asyncReceiveEndpoint('huna-notifications', endpoint => {
    endpoint.handle<NotificationRequest>(new MessageType('NotificationRequest', 'Huna.Notifications.Contracts'),
      async context => {
        console.log(context.message);
      });
  });
}
export default startNotificationRequestConsumer;