import './services/env.loader';
import express, { Application } from "express";
import 'express-async-errors';
import morgan from "morgan";
import opaAuthzMiddleware from "./middlewares/opa-authz.middleware";
import globalErrorHandlerMiddleware from "./middlewares/global-error-handler.middleware";
import healthCheckRouter from "./routes/health-check.route";
import notificationsRouter from './routes/notifications.route';
import startNotificationRequestConsumer from './consumers/notification-request.consumer';
import pushSubscriptionsRouter from './routes/push-subscriptions.route';

const env = process.env.NODE_ENV || "local";
const app: Application = express();
app.use(express.json());
app.use(morgan(
  env === "local" ? "dev" : "common"
));

// Public routes
app.use(healthCheckRouter);

// Secure routes
app.use(opaAuthzMiddleware);

app.use(notificationsRouter);
app.use(pushSubscriptionsRouter);

app.use('*', (_, res) => {
  res.status(404).json({global: ['api.global.notFound']});
});

// Error handler, should always be LAST use()
app.use(globalErrorHandlerMiddleware);


app.listen(3003, () => {
  console.log(`Server is listening on http://localhost:3003`);
});

process.on("SIGINT", () => {
  process.exit();
});

startNotificationRequestConsumer();