import { Request, Response, Router } from "express";
import db from "../services/mongodb.service";
import { NotificationEntity } from "../entities/notification.entity";
import { NotificationDto } from "../contracts/notification.dto";
import { ObjectId, Sort, SortDirection } from "mongodb";
import { UnreadNotificationsDto } from "../contracts/unread-notifications.dto";
import { MarkNotificationResponseDto } from "../contracts/mark-notification-response.dto";

const notificationsRouter = Router();

notificationsRouter.get("/api/notifications/notifications", async (req: Request, res: Response) => {
  const notificationsCollection = db.collection<NotificationEntity>("notifications");
  let start = 0;
  let count = 50;
  let sortBy: string | undefined;
  let sortDir: SortDirection | undefined;
  if (req.query["start"]) {
    start = +req.query["start"].toString();
  }
  if (req.query["count"]) {
    count = +req.query["count"].toString();
  }
  if (req.query["sortBy"]) {
    sortBy = req.query["sortBy"].toString();
    sortDir = 1;
  }
  if (req.query["sortDir"]) {
    sortDir = req.query["sortDir"].toString().toLowerCase() === "asc" ? 1 : -1;
  }

  let sortConfig: Sort = {};
  if (sortBy) {
    sortConfig[sortBy] = sortDir!;
  }

  const notificationDtos = (await notificationsCollection.find({
    userEmail: req.user!.email
  }, {
    skip: start,
    sort: sortConfig
  }).toArray()).map(e => ({
    issuedAt: e.issuedAt,
    _id: e._id.toString(),
    message: e.message,
    severity: e.severity,
    title: e.title,
    readAt: e.readAt
  } as NotificationDto));

  res.send(notificationDtos);
});

notificationsRouter.get("/api/notifications/unread", async (req: Request, res: Response) => {
  const reply: UnreadNotificationsDto = {
    count: 0
  };
  const notificationsCollection = db.collection<NotificationEntity>("notifications");
  reply.count = await notificationsCollection.countDocuments({
    userEmail: req.user!.email,
    readAt: null as any
  });
  res.send(reply);
});

notificationsRouter.put("/api/notifications/notifications", async (req: Request, res: Response) => {
  const notificationsCollection = db.collection<NotificationEntity>("notifications");
  const now = new Date().toISOString();
  const updateResult = await notificationsCollection.updateMany({
    userEmail: req.user!.email,
    readAt: null as any
  }, {
    $set: {
      readAt: now
    }
  });
  
  const reply: MarkNotificationResponseDto = {
    affectedCount: updateResult.modifiedCount
  };
  res.send(reply);
});

notificationsRouter.put("/api/notifications/:id", async (req: Request, res: Response) => {
  const notificationsCollection = db.collection<NotificationEntity>("notifications");
  const now = new Date().toISOString();
  const updateResult = await notificationsCollection.updateOne({
    userEmail: req.user!.email,
    readAt: null as any,
    _id: new ObjectId(req.params["id"])
  }, {
    $set: {
      readAt: now
    }
  })
  const reply: MarkNotificationResponseDto = {
    affectedCount: updateResult.modifiedCount
  };
  res.send(reply);
});

export default notificationsRouter;
