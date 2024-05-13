import {Connection} from 'rabbitmq-client'

export const rabbitmqClient = new Connection(`amqp://admin:${process.env.RABBITMQ_PASSWORD!}@huna-rabbitmq:5672`);

rabbitmqClient.on('error', (err) => {
  console.error('RabbitMQ connection error', err);
})

export default rabbitmqClient;