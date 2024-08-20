const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::countdown-timer.countdown-timer', ({
    strapi
  }) => ({
    async deleteTimerList(ctx) {
        try {
            const timersData = ctx.request.body;
      
            await Promise.all(timersData.map(async (timerData) => {
              const { timerId } = timerData;
      
              const existingTimer = await strapi.db.query('api::countdown-timer.countdown-timer').findOne({
                where: { timerId: timerId },
              });
      
              if (existingTimer) {
                await strapi.entityService.delete('api::countdown-timer.countdown-timer', existingTimer.id);
              }
            }));
          } catch (error) {
            ctx.throw(500, 'An error occurred while deleting timers');
          }
    },
    async getTimerListByUserId(ctx) {
        try {
            const userId = ctx.query.userId;

            const timers = await strapi.entityService.findMany('api::countdown-timer.countdown-timer', {
                filters: {
                  userId: userId 
                }
              });
          
              ctx.body = timers; 
        } catch (error) {
            ctx.throw(500, 'An error occurred while deleting timers');
        }
    }
  }));