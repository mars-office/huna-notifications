import { Request, Response, Router } from "express";
import db from "../services/mongodb.service";
import { NotificationEntity } from "../entities/notification.entity";

const notificationsRouter = Router();

notificationsRouter.get("/api/notifications/notifications", async (req: Request, res: Response) => {
  const notificationsCollection = db.collection<NotificationEntity>("notifications");
  let start = 0;
  let count = 50;
  let sortBy: string | undefined;
  let sortDir: string | undefined;
  if (req.query["start"]) {
    start = +req.query["start"].toString();
  }
  if (req.query["count"]) {
    count = +req.query["count"].toString();
  }
  if (req.query["sortBy"]) {
    sortBy = req.query["sortBy"].toString();
  }
  if (req.query["sortDir"]) {
    sortDir = req.query["sortDir"].toString().toLowerCase();
  }
  const notificationEntities = await notificationsCollection.find({
    userEmail: req.user!.email
  })
});

export default notificationsRouter;
