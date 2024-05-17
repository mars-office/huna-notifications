import masstransit from "masstransit-rabbitmq";

const bus = masstransit({
  host: `admin:${process.env.RABBITMQ_PASSWORD!}@huna-rabbitmq`,
  virtualHost: '/'
});

bus.on('error', err => {
  console.error('RabbitMQ connectivity lost');
  console.error(err);
});

bus.on('connect', () => {
  console.log('RabbitMQ connectivity achieved');
});

export default bus;