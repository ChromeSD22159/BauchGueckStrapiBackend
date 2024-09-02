const { createCoreController } = require('@strapi/strapi').factories;
const {
  stringToInteger,
  userIdToString,
  validateUserId,
  validateTimerStamp
} = require('../../../utils/validation');
module.exports = createCoreController('api::weight.weight', ({ strapi }) => ({
    async updateRemoteData(ctx) {
      const receivedWeights = ctx.request.body;

      for (const receivedWeight of receivedWeights) {

        const { weightId, userId, isDeleted } = receivedWeight;

        // Check if Entry Exist
        const existingEntry = await strapi.db.query('api::weight.weight').findOne({
          where: { weightId, userId }
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
                ...receivedWeight,
                id: existingEntry.id
              }
            });
          } else {
            delete receivedWeight.id;
            await strapi.db.query('api::weight.weight').create({
              data: receivedWeight
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
        if (!validateUserId(ctx)) {
          return;
        }

        const userId = userIdToString(ctx.query.userId);

        const timeStamp = validateTimerStamp(ctx)

        const weights = await strapi.entityService.findMany('api::weight.weight', {
            filters: {
              userId: { $eq: userId },
              updatedAtOnDevice: { $gt: timeStamp}
            },
        });

        if (weights.length === 0) {
            ctx.status = 430;
            ctx.body = {
              error: 'No data to sync',
              message: 'No Weights found after the specified timestamp'
            };
        } else {
            ctx.body = weights;
        }
      } catch (error) {
        strapi.log.error('Fehler beim Löschen von soft-deleted Timern:', error);
      }
    },

    async getCounts(ctx) {
    try {
      const weightsEntries = await strapi.entityService.count('api::weight.weight');

      ctx.body = {
        weightsEntries: weightsEntries
      };
    } catch (err) {
      ctx.status = 500;
      ctx.body = {
        "message": err.message,
      }
    }
  }
}));
