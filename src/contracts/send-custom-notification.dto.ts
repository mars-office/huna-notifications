import { DeliveryType } from "./delivery-type";
import { NotificationSeverity } from "./notification-severity";

export interface SendCustomNotificationDto {
  toUserEmails: string[];
  title: string;
  message: string;
  severity: NotificationSeverity;
  deliveryTypes: DeliveryType[];
  url?: string;
  data?: any;
}