import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:" + process.env.VAPID_EMAIL!,
  process.env.PUBLIC_VAPID_KEY!,
  process.env.PRIVATE_VAPID_KEY!
);

export const sendPushNotification = async <T extends object>(
  subscriptionJson: string,
  payload: T
) => {
  const subscription: webpush.PushSubscription = JSON.parse(subscriptionJson);
  return await webpush.sendNotification(subscription, JSON.stringify(payload), {
    urgency: "high",
  });
};

export default sendPushNotification;
