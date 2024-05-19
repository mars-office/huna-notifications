import { Request, Response, Router } from "express";
import { AddPushSubscriptionDto } from "../contracts/add-push-subscription.dto";
import db from "../services/mongodb.service";
import { PushSubscriptionEntity } from "../entities/push-subscription.entity";
import { AddPushSubscriptionResponseDto } from "../contracts/add-push-subscription-response.dto";
import { ObjectId } from "mongodb";
import { DeletePushSubscription } from "../contracts/delete-push-subscription.dto";
import { DeletePushSubscriptionResponseDto } from "../contracts/delete-push-subscription-response.dto";

const pushSubscriptionsRouter = Router();

pushSubscriptionsRouter.post(
  "/api/notifications/pushSubscriptions",
  async (req: Request, res: Response) => {
    const dto: AddPushSubscriptionDto = req.body;
    if (!dto.json) {
      res.status(400).send({
        global: ["api.notifications.pushSubscriptions.invalidJson"],
      });
      return;
    }
    const pushSubscriptionsCollection =
      db.collection<PushSubscriptionEntity>("pushSubscriptions");
    const response: AddPushSubscriptionResponseDto = {};
    let entity: PushSubscriptionEntity | null =
      await pushSubscriptionsCollection.findOne({
        userEmail: req.user!.email,
        json: dto.json,
      });
    if (entity) {
      response._id = entity._id!.toString();
      res.send(response);
      return;
    }
    const existingPsCount = await pushSubscriptionsCollection.countDocuments({
      userEmail: req.user!.email,
    });
    if (existingPsCount >= 5) {
      // delete oldest
      const oldest = await pushSubscriptionsCollection.find(
        {
          userEmail: req.user!.email,
        },
        {
          limit: 1,
          sort: {
            createdAtTs: 1,
          },
        }
      ).toArray();
      const oldestId = oldest[0]._id;
      await pushSubscriptionsCollection.deleteOne({_id: oldestId});
    }
    entity = {
      userEmail: req.user!.email,
      json: dto.json,
      createdAtTs: new Date().getTime(),
    };
    const insertResponse = await pushSubscriptionsCollection.insertOne(entity);
    response._id = insertResponse.insertedId.toString();
    res.send(response);
  }
);

pushSubscriptionsRouter.put('/api/notifications/pushSubscriptions/delete', async (req, res) => {
  const dto: DeletePushSubscription = req.body;
  if (!dto.json) {
    res.status(400).send({
      global: ["api.notifications.pushSubscriptions.invalidJson"],
    });
    return;
  }
  const pushSubscriptionsCollection =
      db.collection<PushSubscriptionEntity>("pushSubscriptions");
  
  const entityToDelete = await pushSubscriptionsCollection.findOne({
    userEmail: req.user!.email,
    json: dto.json
  });

  if (!entityToDelete) {
    res.status(400).send({
      global: ["api.notifications.pushSubscriptions.inexistentSubscription"],
    });
    return;
  }

  await pushSubscriptionsCollection.deleteOne({_id: entityToDelete._id});

  const response: DeletePushSubscriptionResponseDto = {
    _id: entityToDelete._id.toString()
  };
  res.send(response);
});

export default pushSubscriptionsRouter;
