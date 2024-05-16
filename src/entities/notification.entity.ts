import { ObjectId } from "mongodb";
import { NotificationSeverity } from "../contracts/notification-severity";

export interface NotificationEntity {
  _id?: ObjectId;
  userEmail: string;
  title: string;
  message: string;
  issuedAt: string;
  createdAt: string;
  readAt?: string;
  severity: NotificationSeverity;
}