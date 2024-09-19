module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/send-notification',
            handler: 'notification.sendNotification',
            config: { policies: [] },
        },
        {
          method: 'POST',
          path: '/send-schedule-notification',
          handler: 'notification.scheduleNotification',
          config: { policies: [] },
        },
    ],
};
