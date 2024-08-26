const { createCoreController } = require('@strapi/strapi').factories;
const stringToInteger = require('../../../utils/stringToInteger');
const unixToISO = require('../../../utils/unixToISO');
const userIdToString = require('../../../utils/userIdToString');

module.exports = createCoreController('api::medication.medication', ({
    strapi
  }) => ({
  ...createCoreController('api::medication.medication').actions,

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

    async fetchMedicationsAfterTimeStamp(ctx) {
        try {
            const userId = userIdToString(ctx.query.userId);
            const timeStamp = stringToInteger(ctx.query.timeStamp);

            const timers = await strapi.entityService.findMany('api::medication.medication', {
              filters: {
                userId: { $eq: userId },
                updatedAtOnDevice: { $gt: timeStamp}
              },
            });

            if (timers.length === 0) {
                ctx.status = 404;
                ctx.body = {
                    error: 'No data to sync',
                    message: 'No timer found after the specified timestamp'
                };
            } else {
                ctx.body = timers;
            }
        } catch (error) {
              strapi.log.error('Fehler beim Löschen von soft-deleted Timern:', error);
        }
  },

}));
