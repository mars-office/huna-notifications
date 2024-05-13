import rabbitmqClient from "../services/rabbitmq.service";

export const startNotificationRequestConsumer = () => {
  rabbitmqClient.createConsumer({
    queue: 'NotificationRequest',
    queueOptions: {
      durable: true,
      autoDelete: false,
      exclusive: false
    },
    exchanges: [
      {
        exchange: 'NotificationRequest',
        durable: true,
        type: 'fanout',
      },
      {
        exchange: 'Huna.Notifications.Contracts:NotificationRequest',
        durable: true,
        type: 'fanout'
      }
    ],
    exchangeBindings: [
      {
        source: 'Huna.Notifications.Contracts:NotificationRequest',
        destination: 'NotificationRequest',
      }
    ],
    queueBindings: [
      {
        exchange: 'Huna.Notifications.Contracts:NotificationRequest',
        queue: 'NotificationRequest'
      }
    ]
    
  }, async e => {
    console.log(e);
  });
};

export default startNotificationRequestConsumer;
