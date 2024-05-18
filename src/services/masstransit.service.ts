import masstransit, { Bus } from "masstransit-rabbitmq";
import { ConsumeContext } from "masstransit-rabbitmq/dist/consumeContext";
import { MessageType } from "masstransit-rabbitmq/dist/messageType";
import { SendEndpoint } from "masstransit-rabbitmq/dist/sendEndpoint";

export class MassTransitService {
  private _bus: Bus | undefined;
  private _busConnected = false;
  private _registeredConsumers: {
    queue: string;
    messageType: MessageType;
    consumer: (message: ConsumeContext<any>) => Promise<void>;
  }[] = [];

  constructor() {}

  start(onConnected: (() => void) | undefined = undefined) {
    this._bus = masstransit({
      host: `admin:${process.env.RABBITMQ_PASSWORD!}@huna-rabbitmq`,
      virtualHost: "/",
    });

    this._bus.on("error", (err) => {
      console.error("RabbitMQ error");
      console.error(err);
    });

    this._bus.on("disconnect", () => {
      console.log("RabbitMQ connectivity lost");
      this._busConnected = false;
    });

    this._bus.on("connect", () => {
      this._busConnected = true;
      if (onConnected) {
        setTimeout(() => {
          onConnected();
        }, 1000);
      }
      console.log("RabbitMQ connectivity achieved");
    });

    for (let pair of this._registeredConsumers) {
      this._bus!.receiveEndpoint(pair.queue, (endpoint) => {
        const oldCt = (endpoint as any).configureTopology;
        (endpoint as any).configureTopology = async (channel: any) => {
          for (const messageType of (endpoint as any).boundEvents) {
            await channel.assertExchange(
              messageType.toExchange(),
              "fanout",
              (endpoint as any).options
            );
          }
          await oldCt.bind(endpoint)(channel);
        };
        endpoint.handle<any>(pair.messageType, (m) => {
          (async () => {
            try {
              await pair.consumer(m);
            } catch (e) {
              console.error(e);
              throw e;
            }
          })();
        });
      });
    }
  }

  get isConnected() {
    return this._busConnected;
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

  registerConsumer<T extends object>(
    queue: string,
    messageType: MessageType,
    consumer: (message: ConsumeContext<T>) => Promise<void>
  ) {
    this._registeredConsumers.push({
      queue,
      messageType,
      consumer,
    });
  }

  getSendEndpointByMessageType(mt: MessageType) {
    if (!this._bus) {
      throw new Error("Bus not initialized");
    }
    return new EnhancedSendEndpoint(
      this._bus.sendEndpoint({
        durable: true,
        exchange: mt.ns + ":" + mt.name,
        exchangeType: "fanout",
      }),
      mt
    );
  }

  getSendEndpointByQueue(queue: string, mt: MessageType) {
    if (!this._bus) {
      throw new Error("Bus not initialized");
    }
    return new EnhancedSendEndpoint(
      this._bus.sendEndpoint({
        durable: true,
        queue: queue,
      }),
      mt
    );
  }
}

export class EnhancedSendEndpoint {
  constructor(private _se: SendEndpoint, private _mt: MessageType) {}

  async send<T extends object>(
    message: T,
    headers: object = {},
    correlationId: string | undefined = undefined
  ) {
    return await this._se.send<T>(message, (sc) => {
      sc.messageType = this._mt.toMessageType();
      sc.headers = headers;
      if (correlationId) {
        sc.correlationId = correlationId;
      }
      sc.sentTime = new Date().toISOString();
    });
  }
}
