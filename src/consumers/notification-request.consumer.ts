import { Connection } from "amqplib";
import { NotificationRequest } from "../contracts/notification-request";
import bus from "../services/rabbitmq.service";
import { MessageType } from "masstransit-rabbitmq/dist/messageType";

bus.on("connect", (ctx) => {
  (async () => {
    console.log('Creating queue and exchanges...');
    const conn: Connection = ctx.connection;
    const channel = await conn.createChannel();
    await channel.assertQueue('huna-notifications', {durable: true});
    await channel.assertExchange('Huna.Notifications.Contracts:NotificationRequest', 'fanout', {durable: true});
    await channel.bindQueue('huna-notifications', 'Huna.Notifications.Contracts:NotificationRequest', '');
    channel.close();
    console.log('Created');
  })();
});

bus.receiveEndpoint(`huna-notifications`, (endpoint) => {
  endpoint.handle<NotificationRequest>(
    new MessageType("NotificationRequest", "Huna.Notifications.Contracts"),
    (m) => {
      console.log(m.message);
    }
  );
});