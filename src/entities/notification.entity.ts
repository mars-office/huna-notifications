import { ObjectId } from "mongodb";
import { NotificationSeverity } from "../contracts/notification-severity";

export interface NotificationEntity {
  _id?: ObjectId;
  requestId: string;
  userEmail: string;
  title: string;
  message: string;
  issuedAt: string;
  createdAt: string;
  readAt?: string;
  severity: NotificationSeverity;
  data?: any;
}