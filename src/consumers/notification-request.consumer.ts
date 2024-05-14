import bus from "../services/rabbitmq.service";
import { MessageType } from "masstransit-rabbitmq/dist/messageType";

export const startNotificationRequestConsumer = () => {
  bus.receiveEndpoint(`huna-notifications`, endpoint => {
    endpoint.handle(new MessageType('NotificationRequest', 'Huna.Notifications.Contracts'), async m => {
      console.log(m.message);
    });
  });
}

export default startNotificationRequestConsumer();