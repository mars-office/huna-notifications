import masstransit, { Bus } from "masstransit-rabbitmq";
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

    this._bus.on("connect", () => {
      console.log("RabbitMQ connectivity achieved");
    });

    for (let pair of this._registeredConsumers) {
      this._bus!.receiveEndpoint(pair.queue, (endpoint) => {
        const oldCt = (endpoint as any).configureTopology;
        (endpoint as any).configureTopology = async (channel: any) => {
          for (const messageType of (endpoint as any).boundEvents) {
            await channel.assertExchange(messageType.toExchange(), 'fanout', (endpoint as any).options);
          }
          await (oldCt.bind(endpoint)(channel));
        }
        endpoint.handle<any>(
          pair.messageType,
          (m) => {
            (async () => {
              try {
                await pair.consumer(m);
              } catch (e) {
                console.error(e);
                throw e;
              }
            })();
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
