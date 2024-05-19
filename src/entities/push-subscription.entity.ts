import { ObjectId } from "mongodb";

export interface PushSubscriptionEntity {
  _id?: ObjectId;
  userEmail: string;
  json: string;
  createdAtTs: number;
}