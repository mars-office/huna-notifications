import { Request, Response, Router } from "express";
import { SendCustomNotificationDto } from "../contracts/send-custom-notification.dto";
import { NotificationRequest } from "../contracts/notification-request";
import { SendCustomNotificationResponseDto } from "../contracts/send-custom-notification-response.dto";
import { MessageType } from "masstransit-rabbitmq/dist/messageType";
import bus from "../services/masstransit.service";

const notificationsSendMessageRequestMessageType = new MessageType(
  "NotificationRequest",
  "Huna.Notifications.Contracts"
);
const notificationsSendEndpoint = bus.sendEndpoint({
  durable: true,
  exchange: notificationsSendMessageRequestMessageType.toExchange(),
  exchangeType: "fanout",
  messageType: notificationsSendMessageRequestMessageType,
});

const notificationsAdminRouter = Router();

notificationsAdminRouter.get(
  "/api/notifications/admin/send",
  async (req: Request, res: Response) => {
    const dto: SendCustomNotificationDto = req.body;
    const now = new Date().toISOString();
    if (
      !dto.message ||
      dto.message.length === 0 ||
      !dto.title ||
      dto.title.length === 0 ||
      !dto.toUserEmails ||
      dto.toUserEmails.length === 0
    ) {
      res.status(400).send({
        global: ["api.notifications.admin.send.invalidPayload"],
      });
      return;
    }

    let sent: string[] = [];
    let errored: string[] = [];

    for (const toUserEmail of dto.toUserEmails) {
      const requestPayload: NotificationRequest = {
        toUserEmail: toUserEmail,
        deliveryTypes: dto.deliveryTypes || [],
        issuedAt: now,
        severity: dto.severity || "info",
        message: dto.message,
        title: dto.title,
        data: dto.data,
        url: dto.url,
      };
  
      try {
        await notificationsSendEndpoint.send(requestPayload);
        sent.push(toUserEmail);
      } catch (err: any) {
        // ignored
        console.error('MQ error', err);
        errored.push(toUserEmail);
      }
    }

    const reply: SendCustomNotificationResponseDto = {
      sent: sent,
      errored: errored
    };
    res.send(reply);
  }
);

export default notificationsAdminRouter;
