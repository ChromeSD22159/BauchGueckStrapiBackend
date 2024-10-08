const {
  handleEmptyUserParameter,
  userIdToString,
  validateTimerStamp,
  removeTimestamps,
  handleEmptyResponseBody
} = require("../../../utils/validation");

const {
  createFirebaseJob,
  updateFirebaseJob,
  deleteFirebaseJob,
  handleRecurringNotifications,
  checkFirebaseJob
} = require('../../../utils/firebaseJobs');

module.exports = {
    async getUpdatedMedicationEntries(ctx) {
        if (handleEmptyUserParameter(ctx)) return;

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

        handleEmptyResponseBody(ctx, 'No medication found after the specified timestamp')
    },
    async syncDeviceMedicationData(ctx) {
      const medicationsFromApp = ctx.request.body;

      for (const medicationData of medicationsFromApp) {
        const { medication, intakeTimesWithStatus } = medicationData;

        // 1. Medikament suchen Ob Medikation existiert
        let medicationOrNull = await strapi.db.query('api::medication.medication').findOne({
          where: {
            medicationId: medication.medicationId,
            userId: medication.userId
          },
        });

        // 2. wenn zugesendete gelöscht ist update Strapi
        if (medication.isDeleted) {
            if (medicationOrNull) {
                await strapi.entityService.update('api::medication.medication', medicationOrNull.id, {
                    data: { isDeleted: true },
                });
            }
            continue;
        }

        // 3. set idOrNull
        let medicationIdToUse = medicationOrNull ? medicationOrNull.id : null;

        // 4. wenn Medikament ist vorhanden update anhand der id, wenn nicht entferne id und update
        if (medicationOrNull) {
          // Medikament existiert, also aktualisieren
          await strapi.db.query('api::medication.medication').update({
            where: { id: medicationOrNull.id },
            data: { ...medication, id: medicationOrNull.id },
          });
        } else {
          // Medikament existiert nicht, also erstellen
          delete medication.id;
          const newMedication = await strapi.db.query('api::medication.medication').create({
            data: medication,
          });
          medicationIdToUse = newMedication.id;
        }


        for(const medicationIntakeTimeData of intakeTimesWithStatus) {
          const { intakeTime, intakeStatuses } = medicationIntakeTimeData;
          // 1. Medikament suchen Ob Medikation existiert
          let intakeTimeOrNull = await strapi.db.query('api::intake-time.intake-time').findOne({
            where: {
              intakeTimeId: intakeTime.intakeTimeId
            },
          });

          // 2. set idOrNull
          let intakeTimeIdToUse = intakeTimeOrNull ? intakeTimeOrNull.id : null;

          // 3. wenn Medikament ist vorhanden update anhand der id, wenn nicht entferne id und update
          if (intakeTimeIdToUse) {
              // Medikament existiert, also aktualisieren
              intakeTime.id = intakeTimeIdToUse.id;

              await strapi.db.query('api::intake-time.intake-time').update({
                  where: { id: intakeTimeOrNull.id },
                  data: { ...intakeTime, id: intakeTimeOrNull.id },
              });
          } else {
            // Medikament existiert nicht, also erstellen
            const newIntakeTime = await strapi.entityService.create('api::intake-time.intake-time', {
              data: { ...intakeTime, medication: medicationIdToUse },
            });
            intakeTimeIdToUse = newIntakeTime.id;
          }

            for (const intakeTimeStatusData of intakeStatuses) {

                let intakeStatusOrNull = await strapi.db.query('api::intake-status.intake-status').findOne({
                  where: {
                    intakeStatusId: intakeTimeStatusData.intakeStatusId
                  },
                });

                let intakeStatusIdToUse = intakeStatusOrNull ? intakeStatusOrNull.id : null;

                if (intakeStatusIdToUse) {
                    if(intakeTimeStatusData.isTaken === undefined) {
                        intakeTimeStatusData.isTaken = false
                    }

                    await strapi.db.query('api::intake-status.intake-status').update({
                        where: { id: intakeStatusOrNull.id },
                        data: { ...intakeTimeStatusData, id: intakeStatusOrNull.id },
                    });
                } else {
                    const newIntakeStatus = await strapi.entityService.create('api::intake-status.intake-status', {
                       data: { ...intakeTimeStatusData, intake_time: intakeTimeIdToUse },
                    });
                    intakeStatusIdToUse = newIntakeStatus.id;
                }
            }
        }

        /*
             // 5. Handle recurring notifications based on medication and intake time
        const tokens = await strapi.db.query("api::device-token.device-token").findMany({
            where: {
              userID: medication.userId
            }
        });

        console.log(tokens)

        const tokenList = tokens.map(token => token.deviceToken);

        // Check and update notifications based on the `notify` flag and intake time
        for (const intakeTime of intakeTimesWithStatus.map(i => i.intakeTime)) {
            const existingJob = await checkFirebaseJob(intakeTime.intakeTimeId); // Check for existing job (implement this function)

            if (medication.notify) {
                // If notify is true, either create or update the job
                if (existingJob) {
                    await updateFirebaseJob(intakeTime.intakeTimeId, intakeTime.time, tokenList);
                } else {
                    await createFirebaseJob(intakeTime.intakeTimeId, intakeTime.time, tokenList);
                }
            } else {
                // If notify is false, delete the existing job
                if (existingJob) {
                    await deleteFirebaseJob(intakeTime.intakeTimeId);
                }
            }
        }
         */

      }

      ctx.send({
          message: 'Sync completed successfully'
      });
    },
}
