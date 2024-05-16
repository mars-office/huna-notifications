import masstransit from "masstransit-rabbitmq";

export const bus = masstransit({
  host: `admin:${process.env.RABBITMQ_PASSWORD!}@huna-rabbitmq`,
  virtualHost: '/'
});

bus.on('error', err => {
  console.error('RabbitMQ connectiviy lost');
  console.error(err);
});

bus.on('connect', () => {
  console.log('RabbitMQ connectiviy achieved');
});

export default bus;