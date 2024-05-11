import { Request, Response, Router } from "express";
import { VERSION } from "../version";

const healthCheckRouter = Router();

healthCheckRouter.get("/api/notifications/health", (_: Request, res: Response) => {
  res.send("OK: " + VERSION);
});

export default healthCheckRouter;
