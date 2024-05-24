import { NotificationSeverity } from "./notification-severity";

export interface NotificationDto {
  _id?: string;
  title: string;
  message: string;
  issuedAt: string;
  readAt?: string;
  severity: NotificationSeverity;
  data?: any;
  url?: string;
}