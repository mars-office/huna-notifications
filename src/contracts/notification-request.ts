import { DeliveryType } from "./delivery-type";
import { NotificationSeverity } from "./notification-severity";

export interface NotificationRequest {
  toUserEmail: string;
  title: string;
  message: string;
  issuedAt: string;
  severity: NotificationSeverity;
  deliveryTypes: DeliveryType[];
  url?: string;
  data?: any;
}
