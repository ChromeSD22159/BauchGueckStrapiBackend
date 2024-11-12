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
          const { medicationId, userId, name, dosage, isDeleted, updatedAtOnDevice, intake_times } = medicationData;
  
          let medicationOrNull = await strapi.db.query('api::medication.medication').findOne({
              where: { medicationId, userId },
          });
  
          // Update or create medication
          let medicationIdToUse = medicationOrNull ? medicationOrNull.id : null;
  
          if (medicationOrNull) {
              await strapi.entityService.update('api::medication.medication', medicationOrNull.id, {
                  data: { name, dosage, isDeleted, updatedAtOnDevice },
              });
          } else {
              const newMedication = await strapi.entityService.create('api::medication.medication', {
                  data: { medicationId, userId, name, dosage, isDeleted, updatedAtOnDevice },
              });
              medicationIdToUse = newMedication.id;
          }
  
          // Process Intake Times
          for (const intakeTimeData of intake_times) {
              const { intakeTimeId, intakeTime, isDeleted, updatedAtOnDevice, intake_statuses } = intakeTimeData;
  
              let intakeTimeOrNull = await strapi.db.query('api::intake-time.intake-time').findOne({
                  where: { intakeTimeId },
              });
  
              let intakeTimeIdToUse = intakeTimeOrNull ? intakeTimeOrNull.id : null;
  
              if (intakeTimeOrNull) {
                  await strapi.entityService.update('api::intake-time.intake-time', intakeTimeOrNull.id, {
                      data: { intakeTime, isDeleted, updatedAtOnDevice },
                  });
              } else {
                  const newIntakeTime = await strapi.entityService.create('api::intake-time.intake-time', {
                      data: { intakeTimeId, intakeTime, medication: medicationIdToUse, isDeleted, updatedAtOnDevice },
                  });
                  intakeTimeIdToUse = newIntakeTime.id;
              }
  
              // Process Intake Statuses
              for (const status of intake_statuses) {
                  const { intakeStatusId, date, isTaken, isDeleted, updatedAtOnDevice } = status;
  
                  let intakeStatusOrNull = await strapi.db.query('api::intake-status.intake-status').findOne({
                      where: { intakeStatusId },
                  });
  
                  if (intakeStatusOrNull) {
                      await strapi.entityService.update('api::intake-status.intake-status', intakeStatusOrNull.id, {
                          data: { date, isTaken, isDeleted, updatedAtOnDevice },
                      });
                  } else {
                      await strapi.entityService.create('api::intake-status.intake-status', {
                          data: { intakeStatusId, date, isTaken, isDeleted, updatedAtOnDevice, intake_time: intakeTimeIdToUse },
                      });
                  }
              }
          }
      }
  
      ctx.send({ message: 'Sync completed successfully' });
  }
}
