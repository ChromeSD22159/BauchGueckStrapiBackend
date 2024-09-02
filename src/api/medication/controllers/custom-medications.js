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
  //...createCoreController('api::medication.medication').actions,

    // TODO CHANGE updateRemoteData
    async updateRemoteData(ctx) {
        const items = ctx.request.body;

        const deletedItems = [];

        for (const item of items) {
            const { medicationId, userId, isDeleted } = item;

            // Check if Entry Exist
            const existingEntry = await strapi.db.query('api::medication.medication').findOne({
              where: { medicationId, userId }
            });

            // when timer is SoftDeleted
            if (isDeleted) {
                // Update SoftDelete on Backend
                await strapi.entityService.update('api::medication.medication', existingEntry.id, {
                  data: { isDeleted: true }
                });

                deletedItems.push({ medicationId, userId });

            } else {
                // when Exists Update it else Insert it
                if (existingEntry) {
                    await strapi.db.query('api::medication.medication').update({
                        where: { id: existingEntry.id },
                        data: {
                          ...item,
                          id: existingEntry.id
                        }
                  });
              } else {
                    delete item.id;
                    await strapi.db.query('api::medication.medication').create({
                      data: item
                    });
              }
          }
      }

      ctx.send({
        message: 'Sync completed successfully',
        deletedMedications: deletedItems
      });
    },

    async findUpdated(ctx) {
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

}));


