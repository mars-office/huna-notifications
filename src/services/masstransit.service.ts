import { Connection } from "amqplib";
import masstransit, { Bus } from "masstransit-rabbitmq";
import { ConnectionContext } from "masstransit-rabbitmq/dist/connectionContext";
import { ConsumeContext } from "masstransit-rabbitmq/dist/consumeContext";
import { MessageType } from "masstransit-rabbitmq/dist/messageType";

export class MassTransitService {
  private _bus: Bus | undefined;
  private _registeredConsumers: {
    queue: string;
    messageType: MessageType;
    consumer: (message: ConsumeContext<any>) => Promise<void>
  }[] = [];

  constructor() {}

  start() {
    this._bus = masstransit({
      host: `admin:${process.env.RABBITMQ_PASSWORD!}@huna-rabbitmq`,
      virtualHost: "/",
    });

    this._bus.on("error", (err) => {
      console.error("RabbitMQ connectivity lost");
      console.error(err);
    });

    this._bus.on("connect", (ctx: ConnectionContext) => {
      console.log("RabbitMQ connectivity achieved");
      (async () => {
        console.log("Creating queue and exchanges...");
        const conn: Connection = ctx.connection;
        const channel = await conn.createChannel();
        for (let pair of this._registeredConsumers) {
          console.log(
            "Creating queue exchange pair:" +
              pair.messageType.toString() +
              "->" +
              pair.queue
          );
          await channel.assertQueue(pair.queue, { durable: true });
          await channel.assertExchange(
            pair.messageType.ns + ":" + pair.messageType.name,
            "fanout",
            { durable: true }
          );
          await channel.bindQueue(
            pair.queue,
            pair.messageType.ns + ":" + pair.messageType.name,
            ""
          );

          console.log("Created");
        }
        channel.close();
        console.log("Created all");
      })();
    });

    for (let pair of this._registeredConsumers) {
      this._bus!.receiveEndpoint(pair.queue, (endpoint) => {
        endpoint.handle<any>(
          pair.messageType,
          async (m) => {
            await pair.consumer(m);
          }
        );
      });
    }

  }

  async stop() {
    if (!this._bus) {
      return;
    }
    await this._bus.stop();
  }

  async restart() {
    if (!this._bus) {
      return;
    }
    await this._bus.restart();
  }

  registerConsumer<T extends object>(queue: string, messageType: MessageType, consumer: (message: ConsumeContext<T>) => Promise<void>) {
    this._registeredConsumers.push({
      queue,
      messageType,
      consumer
    });
  }
}
