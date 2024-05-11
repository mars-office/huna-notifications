import amqp, { Channel, AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';

export class RabbitmqService {
  private _connection: AmqpConnectionManager | undefined;
  private _sendChannel: ChannelWrapper | undefined;
  
  constructor() {

  }

  async start() {
    this._connection = amqp.connect('amqp://huna-rabbitmq');
    this._sendChannel = this._connection.createChannel();
  }

  async stop() {
    await this._sendChannel?.close();
    await this._connection?.close();
  }

  async publish<T>(queue: string, payload: T, headers: any = undefined) {
    return await this._sendChannel?.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
      contentType: 'application/json',
      headers: headers
    });
  }

  async consume<T>(queue: string, cb: (payload: T | undefined) => Promise<void>) {
    if (!this._connection) {
      throw new Error('Connection not started');
    }
    const channel = this._connection.createChannel({
      json: true,
      setup: (c: Channel) => {
        c.assertQueue(queue, {durable: true, exclusive: false, autoDelete: false});
      }
    });
    
    channel.consume(queue, m => {
      (async () => {
        let payload: T | undefined;
        if (m.content) {
          payload = <T>JSON.parse(m.content.toString());
        }
        await cb(payload);
        channel.ack(m);
      })();      
    });
  }
}

const rabbitmqService = new RabbitmqService();
export default rabbitmqService;