import masstransit from 'masstransit-rabbitmq';

export const bus = masstransit({
  host: `admin:${process.env.RABBITMQ_PASSWORD!}@huna-rabbitmq`,
  virtualHost: '/'
});

export default bus;