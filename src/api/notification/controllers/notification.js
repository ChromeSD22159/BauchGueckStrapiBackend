const admin = require('../../../../config/firebase');
const schedule = require('node-schedule');
module.exports = {
    async sendNotification(ctx) {
        const { token, title, body, data } = ctx.request.body;

        if (!token || !title || !body) {
          return ctx.badRequest('Token, Title und Body sind erforderlich.');
        }

        const message = {
          notification: {
            title: title,
            body: body,
          },
          token: token, // FCM Device Token
          data: data || {}, // Optional zusätzliche Daten
        };

        try {
          const response = await admin.messaging().send(message);
          return ctx.send({ message: 'Notification erfolgreich gesendet', response });
        } catch (error) {
          return ctx.badRequest('Fehler beim Senden der Nachricht', { error });
        }
    },

    async scheduleNotification(ctx) {
        const { token, title, body, data, scheduledTime } = ctx.request.body;

        // Überprüfe, ob alle benötigten Felder vorhanden sind
        if (!token || !title || !body || !scheduledTime) {
            return ctx.badRequest('Token, Title, Body und ScheduledTime sind erforderlich.');
        }

        // Überprüfe, ob der Zeitpunkt in der Zukunft liegt
        const scheduledDate = new Date(scheduledTime);
        if (scheduledDate < new Date()) {
            return ctx.badRequest('Der geplante Zeitpunkt muss in der Zukunft liegen.');
        }

        // Nachricht, die gesendet werden soll
        const message = {
            notification: {
                title: title,
                body: body,
            },
            token: token,
            data: data || {}, // Optionale Daten
        };

        // Nachricht für den geplanten Zeitpunkt schedulen
        const job = schedule.scheduleJob(scheduledDate, async function () {
            try {
                const response = await admin.messaging().send(message);
                console.log('Nachricht erfolgreich gesendet:', response);

                strapi.log.info(response)
            } catch (error) {
                console.error('Fehler beim Senden der Nachricht:', error);
            }
        });

        return ctx.send({
            message: 'Nachricht geplant',
            response: scheduledTime
          });
    },

    async scheduleRecurringNotification(ctx) {
        const { token, title, body, data, rule } = ctx.request.body;

        // Überprüfe, ob alle benötigten Felder vorhanden sind
        if (!token || !title || !body || !rule) {
            return ctx.badRequest('Token, Title, Body und Regel sind erforderlich.');
        }

        // Nachricht, die gesendet werden soll
        const message = {
            notification: {
              title: title,
              body: body,
            },
            token: token,
            data: data || {}, // Optionale Daten
        };

        // Plane die wiederkehrende Aufgabe
        const job = schedule.scheduleJob(rule, async function () {
            try {
                const response = await admin.messaging().send(message);
                console.log('Wiederkehrende Nachricht erfolgreich gesendet:', response);
                strapi.log.info(response);
            } catch (error) {
                console.error('Fehler beim Senden der wiederkehrenden Nachricht:', error);
            }
        });

        return ctx.send({
            message: 'Wiederkehrende Nachricht geplant',
            notificationId: job.id, // Gib die Job-ID zurück, um die Aufgabe später zu löschen
        });
    },

    async cancelScheduledNotification(ctx) {
        const { notificationId } = ctx.params;

        // Überprüfe, ob die Job-ID vorhanden ist
        if (!notificationId) {
          return ctx.badRequest('Job-ID ist erforderlich.');
        }

        // Versuche, die Aufgabe zu finden und zu löschen
        const job = schedule.scheduledJobs()[notificationId];
        if (job) {
            job.cancel();
            return ctx.send({
                message: 'Geplante Aufgabe erfolgreich gelöscht',
                notificationId: notificationId
            });
        } else {
            return ctx.notFound('Geplante Aufgabe nicht gefunden');
        }
    }
};
