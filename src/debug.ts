import './services/env.loader';
import { MessageType } from "masstransit-rabbitmq/dist/messageType";
import bus from "./services/masstransit.service";
import { NotificationRequest } from "./contracts/notification-request";

(async () => {
  const mt = new MessageType(
    "NotificationRequest",
    "Huna.Notifications.Contracts"
  );
  const se = bus.sendEndpoint({
    durable: true,
    exchange: mt.toExchange(),
    exchangeType: "fanout",
    messageType: mt,
  });
  setTimeout(() => {
    (async () => {
      await se.send<NotificationRequest>({
        deliveryTypes: ["email", "push", "signalr"],
        issuedAt: new Date().toISOString(),
        message: "mesaj aici",
        title: "titlu aici",
        severity: "success",
        toUserEmail: "test@qoffice.ro",
        data: { hehe: 2 },
      });
      console.log("Done");
      process.exit(0);
    })();
  }, 5000);
})();
