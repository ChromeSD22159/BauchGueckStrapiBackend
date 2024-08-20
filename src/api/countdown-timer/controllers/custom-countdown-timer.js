const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::countdown-timer.countdown-timer', ({
    strapi
  }) => ({
    ...createCoreController('api::countdown-timer.countdown-timer').actions,
    
    async deleteTimerList(ctx) {
        try {
            const timerIds = ctx.request.body; // Assuming an array of timerIds to delete

            // Use deleteMany for potentially better performance when deleting multiple records
            const deletedTimers = await strapi.entityService.deleteMany('api::countdown-timer.countdown-timer', {
            filters: {
                timerId: { $in: timerIds }, // Delete timers where timerId is in the provided array
            },
            });

            ctx.body = deletedTimers; // Optionally return the deleted timers
        } catch (error) {
            console.error('Error deleting timers:', error); // Log the error for debugging
            ctx.throw(500, 'An error occurred while deleting timers');
        }
    },
    
    async getTimerListByUserId(ctx) {
        try {
          const userId = ctx.query.userId;
    
          const timers = await strapi.entityService.findMany('api::countdown-timer.countdown-timer', {
            filters: {
              userId: userId,
            },
          });
    
          ctx.body = timers;
        } catch (error) {
          console.error('Error fetching timers by user ID:', error); // Log the error for debugging
          ctx.throw(500, 'An error occurred while fetching timers'); // More specific error message
        }
    },

    async updateOrInsert(ctx) {
      strapi.log.debug('timersData: ', ctx.request);

      const timersData = ctx.request.body;

      const results = await Promise.all(timersData.map(async (timerData) => {
          const { timerId } = timerData;
      
          const existingTimer = await strapi.db.query('api::countdown-timer.countdown-timer').findOne({
              where: { timerId: timerId },
          });

          if (existingTimer) {
              // Timer existiert bereits, aktualisieren Sie ihn
              // Entfernen Sie die 'id' aus timerData, bevor Sie aktualisieren, um die Strapi-ID beizubehalten
              timerData.id = existingTimer.id

              const updatedTimer = await strapi.entityService.update('api::countdown-timer.countdown-timer', existingTimer.id, {
                  data: timerData // Verwenden Sie das timerData-Objekt, um das vorhandene Objekt zu aktualisieren
              });
              
              strapi.log.debug('Updated with the StrapiID: %d', updatedTimer.id);

              return updatedTimer;
          } else {
              // Timer existiert nicht, erstellen Sie einen neuen
              delete timerData.id; 
              const newTimer = await strapi.entityService.create('api::countdown-timer.countdown-timer', {
                  data: timerData // Verwenden Sie das timerData-Objekt, um ein neues Objekt zu erstellen
              });

              strapi.log.debug('Created: %d', newTimer.id);
              return newTimer;
          }
      }));
  }

  }));