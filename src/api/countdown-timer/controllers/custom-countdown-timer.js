const {
  stringToInteger,
  userIdToString, validateUserId, validateTimerStamp
} = require('../../../utils/validation');

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::countdown-timer.countdown-timer', ({
    strapi
  }) => ({
    ...createCoreController('api::countdown-timer.countdown-timer').actions,

    async updateRemoteData(ctx) {
        const timers = ctx.request.body;

        for (const timer of timers) {

            const { timerId, userId, isDeleted } = timer;

            // Check if Entry Exist
            const existingEntry = await strapi.db.query('api::countdown-timer.countdown-timer').findOne({
                where: { timerId, userId }
            });

            // when timer is SoftDeleted
            if (isDeleted) {
                // Update SoftDelete on Backend
                await strapi.entityService.update('api::countdown-timer.countdown-timer', existingEntry.id, {
                  data: { isDeleted: true }
                });

            } else {
                // when Exists Update it else Insert it
                if (existingEntry) {
                    await strapi.db.query('api::countdown-timer.countdown-timer').update({
                        where: { id: existingEntry.id },
                        data: {
                            ...timer,
                            id: existingEntry.id
                         }
                    });
                } else {
                    delete timer.id;
                    await strapi.db.query('api::countdown-timer.countdown-timer').create({
                        data: timer
                    });
                }
            }
        }

        ctx.send({
            message: 'Sync completed successfully'
        });
    },

    async fetchItemsAfterTimeStamp(ctx) {
        try {
          if (!validateUserId(ctx)) {
            return;
          }

          const userId = userIdToString(ctx.query.userId);

          const timeStamp = validateTimerStamp(ctx)

            const timers = await strapi.entityService.findMany('api::countdown-timer.countdown-timer', {
                filters: {
                    userId: { $eq: userId },
                    updatedAtOnDevice: { $gt: timeStamp}
                },
            });

            if (timers.length === 0) {
                ctx.status = 430;
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
