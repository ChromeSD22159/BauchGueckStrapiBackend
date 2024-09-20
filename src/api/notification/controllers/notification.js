const {
  admin
} = require('../../../../config/firebase');

const schedule = require('node-schedule');
const cron = require('node-cron');

global.jobs = global.jobs || {};

module.exports = {
    // TODO WORKS
    async sendNotification(ctx) {
        const { token, title, body, data } = ctx.request.body;

        if (!token || !title || !body) {
          return ctx.badRequest('Token, Title und Body sind erforderlich.');
        }

        console.log(token)

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

    // TODO WORKS
    async scheduleNotification(ctx) {
        // Extrahiere die Daten aus dem Request-Body
        const { notification, cronJob } = ctx.request.body;

        console.log(notification.token)

        // Überprüfe, ob die benötigten Felder vorhanden sind
        if (!notification || !notification.token || !notification.title || !notification.body) {
            return ctx.badRequest('Notification-Details sind unvollständig. Token, Title und Body sind erforderlich.');
        }

        // Überprüfe, ob das geplante Datum vorhanden ist, wenn es ein einmaliger Job ist
        if (cronJob && !cronJob.isRecurring && !cronJob.cronExpression) {
            return ctx.badRequest('Für einmalige Jobs muss ein gültiges Datum im cronExpression-Feld vorhanden sein.');
        }

        // Nachricht, die gesendet werden soll
        const message = {
            notification: {
              title: notification.title,
              body: notification.body,
            },
            token: notification.token,
            data: notification.data || {}, // Optionale Daten
        };

        try {
            // Wenn cronJob vorhanden und kein Wiederholungsjob ist, dann planen wir den einmaligen Job
            if (cronJob && !cronJob.isRecurring) {
                const scheduledDate = new Date(cronJob.cronExpression);
                if (scheduledDate <= new Date()) {
                    return ctx.badRequest('Der geplante Zeitpunkt muss in der Zukunft liegen.');
                }

                // Nachricht für den geplanten Zeitpunkt schedulen
                const job = schedule.scheduleJob(scheduledDate, async function () {
                    try {
                        const response = await admin.messaging().send(message);
                        console.log('Nachricht erfolgreich gesendet:', response);
                    } catch (error) {
                        console.error('Fehler beim Senden der Nachricht:', error);
                    }
                });

                // Antwort an den Client zurückgeben
                return ctx.send({
                    message: 'Einmalige Nachricht geplant',
                    scheduledTime: cronJob.cronExpression
                });
            } else {
                // Hier könnte man die Logik für wiederkehrende Jobs einfügen, wenn das unterstützt wird.
                return ctx.badRequest('Wiederholungsjobs werden aktuell nicht unterstützt.');
            }
        } catch (error) {
          strapi.log.error(`Fehler beim Planen des Jobs: ${error}`);
          return ctx.internalServerError('Fehler beim Planen des Jobs.');
        }
    },

    // Erstellen eines neuen CronJobs durch Anfragen an die Firebase Cloud Function
    async createCronJob(ctx) {
        const { notification, cronJob } = ctx.request.body;

        if (!notification || !cronJob || !cronJob.identifier) {
            return ctx.badRequest('Notification und CronJob Details sind erforderlich.');
        }

        const expression = generateCronExpression(cronJob)

        if (global.jobs[cronJob.identifier]) {
            return ctx.badRequest('Notification existiert bereits.');
        }

        // Erstelle die Cron-Expression
        let cronExpression;
        if (cronJob.cronExpression) {
            cronExpression = cronJob.cronExpression;
        } else {
            cronExpression = generateCronExpression(cronJob);
        }

        // Prüfe, ob die erstellte Cron-Expression ein gültiger String ist
        if (typeof cronExpression !== 'string') {
            return ctx.badRequest('Die Cron-Expression muss ein gültiger String sein.');
        }

        // Prüfe, ob bereits ein Job mit dem Identifier existiert
        if (global.jobs[cronJob.identifier]) {
            return ctx.badRequest('Ein CronJob mit diesem Identifier existiert bereits.');
        }

        try {
            // Erstelle und plane den neuen CronJob
            const message = {
                notification: {
                  title: notification.title,
                  body: notification.body,
                },
                token: notification.token,
                data: notification.data || {}, // Optionale Daten
            };



            global.jobs[cronJob.identifier] = {
                expression,
                notification
            }

            console.log(cronJob)

            return ctx.send({ message: 'CronJob erfolgreich erstellt', cronJob });
        } catch (error) {
            strapi.log.error('Fehler beim Erstellen des CronJobs:', error);
            return ctx.internalServerError('Fehler beim Erstellen des CronJobs.');
        }
    },

    // Aktualisieren eines bestehenden CronJobs durch Anfragen an die Firebase Cloud Function
    async updateCronJob(ctx) {
        const { notification, cronJob } = ctx.request.body;

        // Validierung der Eingabedaten
        if (!notification || !cronJob || !cronJob.identifier) {
            return ctx.badRequest('Notification, CronJob und Identifier sind erforderlich.');
        }

        try {
            // Prüfe, ob der bestehende CronJob existiert
            if (global.jobs[cronJob.identifier]) {
              strapi.log.info(`CronJob ${cronJob.identifier} wird gelöscht und neu erstellt.`);

              // Lösche den bestehenden CronJob
              global.jobs[cronJob.identifier].stop(); // Stoppt den aktuellen CronJob
              delete global.jobs[cronJob.identifier]; // Entfernt den Job aus dem globalen Speicher
              strapi.log.info(`Bestehender Job erfolgreich gestoppt und gelöscht: ${cronJob.identifier}`);
            } else {
              return ctx.notFound('CronJob nicht gefunden.');
            }

            // Generiere die Cron-Expression
            const cronExpression = cronJob.cronExpression || generateCronExpression(cronJob);

            // Überprüfe, ob die Cron-Expression ein gültiger String ist
            if (typeof cronExpression !== 'string') {
              return ctx.badRequest('Die Cron-Expression muss ein gültiger String sein.');
            }

            // Erstelle und plane den neuen CronJob
            const job = cron.schedule(cronExpression, async () => {
                const message = {
                  notification: {
                    title: notification.title,
                    body: notification.body,
                  },
                  token: notification.token,
                  data: notification.data || {}, // Optionale Daten
                };

                try {
                  const response = await admin.messaging().send(message);
                  console.log('Nachricht erfolgreich gesendet:', response);
                  strapi.log.info(`Nachricht erfolgreich gesendet: ${response}`);
                } catch (error) {
                  console.error('Fehler beim Senden der Nachricht:', error);
                  strapi.log.error(`Fehler beim Senden der Nachricht: ${error}`);
                }
            });

            // Speichere den neuen Job im globalen Speicher
            global.jobs[cronJob.identifier] = job;
            strapi.log.info(`Job erfolgreich erstellt: ${cronJob.identifier}`);

            return ctx.send({ message: 'CronJob erfolgreich aktualisiert', cronJob });
        } catch (error) {
          strapi.log.error('Fehler beim Aktualisieren des CronJobs:', error);
          return ctx.internalServerError('Fehler beim Aktualisieren des CronJobs.');
        }
    },

    // Löschen eines CronJobs durch Anfragen an die Firebase Cloud Function
    async deleteCronJob(ctx) {
        const { identifier } = ctx.request.body;

        if (!identifier) {
            return ctx.badRequest('Identifier ist erforderlich.');
        }

        try {
            // Lösche den Job, falls er existiert
            if (global.jobs[identifier]) {
              strapi.log.info(`Lösche den Job mit Identifier: ${identifier}`);
              global.jobs[identifier].stop(); // Stoppt den CronJob
              delete global.jobs[identifier]; // Entfernt den Job aus dem globalen Speicher
              strapi.log.info(`Job erfolgreich gelöscht: ${identifier}`);
              return ctx.send({ message: 'CronJob erfolgreich gelöscht', identifier });
            } else {
              return ctx.notFound('CronJob nicht gefunden.');
            }
        } catch (error) {
            // Logge den Fehler für eine detaillierte Analyse
            strapi.log.error('Fehler beim Löschen des CronJobs:', error.message || error);
            return ctx.internalServerError('Fehler beim Löschen des CronJobs. Details: ' + (error.message || error));
        }
    }
};

function generateCronExpression({ minutes = [], hours = [], daysOfMonth = [], months = [], daysOfWeek = [] }) {
    const minutePart = minutes.length === 0 ? '*' : minutes.join(',');
    const hourPart = hours.length === 0 ? '*' : hours.join(',');
    const dayOfMonthPart = daysOfMonth.length === 0 ? '*' : daysOfMonth.join(',');
    const monthPart = months.length === 0 ? '*' : months.join(',');
    const dayOfWeekPart = daysOfWeek.length === 0 ? '*' : daysOfWeek.join(',');

    return `${minutePart} ${hourPart} ${dayOfMonthPart} ${monthPart} ${dayOfWeekPart}`;
}
