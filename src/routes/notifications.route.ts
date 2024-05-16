import { Request, Response, Router } from "express";
import { VERSION } from "../version";

const notificationsRouter = Router();

notificationsRouter.get("/api/notifications/notifications", async (req: Request, res: Response) => {
  
  res.send("OK: " + VERSION);
});

export default notificationsRouter;
