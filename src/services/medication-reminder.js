const {schedule} = require("node-cron");
const {admin} = require("../../config/firebase");

/*
*    *    *    *    *    *
|    |    |    |    |    |
|    |    |    |    |    └─── Day of the Week (0 - 7) (Sunday to Saturday)
|    |    |    |    └──────── Month (1 - 12)
|    |    |    └───────────── Day of the Month (1 - 31)
|    |    └────────────────── Hour (0 - 23)
|    └─────────────────────── Minute (0 - 59)
└──────────────────────────── Second (0 - 59) (Optional)

module.exports = {
  '* * * * *': async ({ strapi }) => {
    console.log('Cron running...');
    try {
      // Hole alle Medikamente mit den geplanten Einnahmezeiten und Statuseinträgen
      const medications = await strapi.entityService.findMany('api::medication.medication', {
        populate: {
          intake_times: {
            populate: 'intake_statuses',
          },
        },
      });

      // Hole die aktuelle Zeit
      const currentTime = new Date();

      for (const medication of medications) {
        const medicationId = medication.medicationId;
        const userId = medication.userId;
        const intakeTimes = medication.intake_times;

        for (const intake of intakeTimes) {
          const intakeTime = intake.intakeTime; // Beispiel: '08:00'
          const intakeDateTime = new Date(`${currentTime.toISOString().split('T')[0]}T${intakeTime}:00.000Z`);

          // Prüfe, ob ein Status existiert
          const intakeStatus = intake.intake_statuses.length > 0;

          // Zeitfenster für die Benachrichtigung (z.B. 5 Minuten vor und nach der Einnahmezeit)
          const notificationWindowStart = new Date(intakeDateTime);
          notificationWindowStart.setMinutes(notificationWindowStart.getMinutes() - 1);

          const notificationWindowEnd = new Date(intakeDateTime);
          notificationWindowEnd.setMinutes(notificationWindowEnd.getMinutes() + 1);

          // Logge die Serverzeit und die Einnahmezeit
          console.log(`Serverzeit: ${currentTime.toISOString()}`);
          console.log(`Geplante Einnahmezeit (intakeTime): ${intakeDateTime.toISOString()}`);

          // Benachrichtigung senden, wenn im Zeitfenster und keine Status vorhanden
          if (currentTime >= notificationWindowStart && currentTime <= notificationWindowEnd && !intakeStatus) {
            console.log(`Benachrichtigung für Medication ID ${medicationId} an User ${userId} senden für Einnahmezeit ${intakeTime}`);

            const userTokens = await strapi.db.query('api::device-token.device-token').findMany({
              where: { userId }
            });

            if (userTokens.length === 0) {
              console.log(`Keine DeviceTokens für Benutzer ${userId} gefunden.`);
              continue;
            }

            // Nachricht erstellen
            const message = {
              notification: {
                title: "BauchGlück Notification",
                body: `Dein Medikament ${medication.name} soll jetzt eingenommen werden!`,
              },
              data: {
                medicationId: medicationId.toString(),
                intakeTime: intakeTime,
              }
            };

            // Nachricht an alle Geräte des Benutzers senden
            for (const deviceToken of userTokens) {
              try {
                const response = await admin.messaging().send({
                  ...message,
                  token: deviceToken.token // Setze den Token in die Nachricht
                });
                console.log(`Benachrichtigung erfolgreich gesendet an Token: ${deviceToken.token}, Response: ${response}`);
              } catch (error) {
                console.error(`Fehler beim Senden der Benachrichtigung an Token ${deviceToken.token}:`, error);
              }
            }
          } else {
            console.log(`Einnahmezeit ${intakeTime} für Medication ID ${medicationId} wurde bereits bearbeitet oder liegt außerhalb des Zeitfensters.`);
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling medication reminders:', error);
    }
  }
};
*/

module.exports = {
  '* * * * 1': async ({ strapi }) => {
    console.log('Cron running...');
    try {
      // Hole alle Medikamente mit den geplanten Einnahmezeiten und Statuseinträgen
      const medications = await strapi.entityService.findMany('api::medication.medication', {
        populate: {
          intake_times: {
            populate: 'intake_statuses',
          },
        },
      });

      // Hole die aktuelle Zeit (verwende UTC, um Verwirrung durch Zeitzonen zu vermeiden)
      const currentTime = new Date();

      for (const medication of medications) {
        const medicationId = medication.medicationId;
        const userId = medication.userId;
        const intakeTimes = medication.intake_times;

        for (const intake of intakeTimes) {
          const intakeTime = intake.intakeTime; // Beispiel: '08:00'

          // Nutze UTC für die Einnahmezeit (um sicherzustellen, dass die Zeitzonen übereinstimmen)
          const intakeDateTime = new Date(`${currentTime.toISOString().split('T')[0]}T${intakeTime}:00.000Z`);

          // Prüfe, ob ein Status existiert
          const intakeStatus = intake.intake_statuses.length > 0;

          // Zeitfenster für die Benachrichtigung (z.B. 1 Minute vor und nach der Einnahmezeit)
          const notificationWindowStart = new Date(intakeDateTime);
          notificationWindowStart.setMinutes(notificationWindowStart.getMinutes() - 1);

          const notificationWindowEnd = new Date(intakeDateTime);
          notificationWindowEnd.setMinutes(notificationWindowEnd.getMinutes() + 1);

          // Logge die Serverzeit und die geplante Einnahmezeit
          console.log(`Serverzeit (UTC): ${currentTime.toISOString()}`);
          console.log(`Geplante Einnahmezeit (intakeTime, UTC): ${intakeDateTime.toISOString()}`);

          // Benachrichtigung senden, wenn im Zeitfenster und kein Status vorhanden
          if (currentTime >= notificationWindowStart && currentTime <= notificationWindowEnd && !intakeStatus) {
            console.log(`Benachrichtigung für Medication ID ${medicationId} an User ${userId} senden für Einnahmezeit ${intakeTime}`);

            const userTokens = await strapi.db.query('api::device-token.device-token').findMany({
              where: { userId }
            });

            if (userTokens.length === 0) {
              console.log(`Keine DeviceTokens für Benutzer ${userId} gefunden.`);
              continue;
            }

            // Nachricht erstellen
            const message = {
              notification: {
                title: "BauchGlück Notification",
                body: `Dein Medikament ${medication.name} soll jetzt eingenommen werden!`,
              },
              data: {
                medicationId: medicationId.toString(),
                intakeTime: intakeTime,
              }
            };

            // Nachricht an alle Geräte des Benutzers senden
            for (const deviceToken of userTokens) {
              try {
                const response = await admin.messaging().send({
                  ...message,
                  token: deviceToken.token // Setze den Token in die Nachricht
                });
                console.log(`Benachrichtigung erfolgreich gesendet an Token: ${deviceToken.token}, Response: ${response}`);
              } catch (error) {
                console.error(`Fehler beim Senden der Benachrichtigung an Token ${deviceToken.token}:`, error);
              }
            }
          } else {
            console.log(`Einnahmezeit ${intakeTime} für Medication ID ${medicationId} wurde bereits bearbeitet oder liegt außerhalb des Zeitfensters.`);
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling medication reminders:', error);
    }
  }
};
