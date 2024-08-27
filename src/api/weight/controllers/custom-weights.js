const stringToInteger = require('../../../utils/stringToInteger');
const unixToISO = require('../../../utils/unixToISO');
const userIdToString = require('../../../utils/userIdToString');
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::weight.weight', ({ strapi }) => ({
    async updateRemoteData(ctx) {
      const timers = ctx.request.body;

      for (const timer of timers) {

        const { timerId, userId, isDeleted } = timer;

        // Check if Entry Exist
        const existingEntry = await strapi.db.query('api::weight.weight').findOne({
          where: { timerId, userId }
        });

        // when timer is SoftDeleted
        if (isDeleted) {
          // Update SoftDelete on Backend
          await strapi.entityService.update('api::weight.weight', existingEntry.id, {
            data: { isDeleted: true }
          });

        } else {
          // when Exists Update it else Insert it
          if (existingEntry) {
            await strapi.db.query('api::weight.weight').update({
              where: { id: existingEntry.id },
              data: {
                ...timer,
                id: existingEntry.id
              }
            });
          } else {
            delete timer.id;
            await strapi.db.query('api::weight.weight').create({
              data: timer
            });
          }
        }
      }


        ctx.send({
            message: 'Sync completed successfully',
        });
    },

    async fetchItemsAfterTimeStamp(ctx) {
      try {
        const userId = userIdToString(ctx.query.userId);
        const timeStamp = stringToInteger(ctx.query.timeStamp);

        const timers = await strapi.entityService.findMany('api::weight.weight', {
            filters: {
              userId: { $eq: userId },
              updatedAtOnDevice: { $gt: timeStamp}
            },
        });

        if (timers.length === 0) {
          ctx.status = 701;
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
