const { createCoreController } = require('@strapi/strapi').factories;

const {
  validateUserId,
  validateTimerStamp,
  validateRequestBodyIsArray,
  removeTimestamps,
  stringToInteger,
  userIdToString
} = require('../../../utils/validation');


module.exports = createCoreController('api::medication.medication', ({
    strapi
  }) => ({
      /*
    async getUpdatedEntries(ctx) {
        if (!validateUserId(ctx)) {
          return; // Beendet die Ausführung, wenn die User ID ungültig ist
        }

        const userId = userIdToString(ctx.query.userId);

        const timeStamp = validateTimerStamp(ctx)

        let result = await strapi.entityService.findMany('api::medication.medication', {
          filters: {
              userId: userId,
              updatedAtOnDevice: { $gt: timeStamp },
          },
          populate: {
              intake_times: {
                filters: {
                  updatedAtOnDevice: {$gt: timeStamp}, // Filter intake times
                },
                populate: 'intake_statuses',
              },
          },
      });

        ctx.body = removeTimestamps(result);
    },
    async syncDeviceData(ctx) {
      const medicationsFromApp = ctx.request.body;

      for (const medicationData of medicationsFromApp) {
        const { medicationId, userId, isDeleted, intake_times } = medicationData;

        // 1. Medikament suchen oder erstellen
        let medicationOrNull = await strapi.db.query('api::medication.medication').findOne({
          where: { medicationId, userId },
        });

        if (isDeleted) {
          if (medicationOrNull) {
            // Medikament existiert und soll gelöscht werden (Soft-Delete)
            await strapi.entityService.update('api::medication.medication', medicationOrNull.id, {
              data: { isDeleted: true },
            });
          }
          // Wenn das Medikament nicht existiert und als gelöscht markiert ist, ignorieren wir es einfach
          continue;
        }

        if (medicationOrNull) {
          // Medikament existiert, also aktualisieren
          await strapi.db.query('api::medication.medication').update({
            where: { id: medicationOrNull.id },
            data: { ...medicationData, id: medicationOrNull.id },
          });
        } else {
          // Medikament existiert nicht, also erstellen
          delete medicationData.id; // Sicherstellen, dass keine ID von der App übergeben wird
          await strapi.db.query('api::medication.medication').create({
            data: medicationData,
          });
        }

        // 2. Einnahmezeiten verarbeiten (nur wenn das Medikament nicht gelöscht wurde)
        if (!isDeleted) {
          for (const intakeTimeData of intake_times) {
            const { id: intakeTimeId, intakeTime, intake_statuses } = intakeTimeData;

            // Einnahmezeit suchen oder erstellen
            let intakeTimeOrNull = await strapi.db.query('api::intake-time.intake-time').findOne({
              where: { id: intakeTimeId, medication: medicationOrNull.id },
            });

            if (intakeTimeOrNull) {
              // Einnahmezeit existiert, also aktualisieren
              await strapi.db.query('api::intake-time.intake-time').update({
                where: { id: intakeTimeOrNull.id },
                data: { intakeTime },
              });
            } else {
              // Einnahmezeit existiert nicht, also erstellen
              delete intakeTimeData.id;
              await strapi.db.query('api::intake-time.intake-time').create({
                data: { ...intakeTimeData, medication: medicationOrNull.id },
              });
            }

            // 3. Einnahmestatus verarbeiten
            for (const intakeStatusData of intake_statuses) {
              const { id: intakeStatusId, date, isTaken } = intakeStatusData;

              // Einnahmestatus suchen oder erstellen
              let intakeStatus = await strapi.db.query('api::intake-status.intake-status').findOne({
                where: { id: intakeStatusId, intake_time: intakeTime.id },
              });

              if (intakeStatus) {
                // Einnahmestatus existiert, also aktualisieren
                await strapi.db.query('api::intake-status.intake-status').update({
                  where: { id: intakeStatus.id },
                  data: { isTaken },
                });
              } else {
                // Einnahmestatus existiert nicht, also erstellen
                delete intakeStatusData.id;
                await strapi.db.query('api::intake-status.intake-status').create({
                  data: { ...intakeStatusData, intake_time: intakeTime.id },
                });
              }
            }
          }
        }
      }

      ctx.send({
        message: 'Sync completed successfully'
      });
    },
      */
}));


