import masstransit from "masstransit-rabbitmq";

export const bus = masstransit({
  host: `admin:${process.env.RABBITMQ_PASSWORD!}@huna-rabbitmq`,
  virtualHost: "/",
});

export default bus;

bus.on("error", (err) => {
  console.error("RabbitMQ error");
  console.error(err);
});

bus.on("disconnect", () => {
  console.log("RabbitMQ connectivity lost");
});

bus.on("connect", () => {
  console.log("RabbitMQ connectivity achieved");
});
