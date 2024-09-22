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
        {
            method: 'POST',
            path: '/create-cronjob',
            handler: 'notification.createCronJob',
            config: { policies: [] },
        },
        {
            method: 'POST',
            path: '/update-cronjob',
            handler: 'notification.updateCronJob',
            config: { policies: [] },
        },
        {
            method: 'POST',
            path: '/delete-cronjob',
            handler: 'notification.deleteCronJob',
            config: { policies: [] },
        },
        {
            method: 'POST',
            path: '/send-notification-all-user',
            config: { policies: [] },
            handler: 'notification.notificationToAllUsers',
        }
    ],
};
