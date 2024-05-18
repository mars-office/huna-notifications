import { ConsumeContext } from "masstransit-rabbitmq/dist/consumeContext";
import { NotificationRequest } from "../contracts/notification-request";

export const notificationRequestConsumer = async (message: ConsumeContext<NotificationRequest>) => {
  console.log(message.message);
  console.log(message.headers);
}

export default notificationRequestConsumer;