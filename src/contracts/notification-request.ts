export interface NotificationRequest {
  To: string;
  From?: string;
  Message: string;
  Title: string;
  DeliveryTypes: ("email" | "push" | "realtime")[];
}