const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::countdown-timer.countdown-timer', ({
    strapi
  }) => ({
    async updateOrInsert(ctx) {
        const timersData = ctx.request.body;

        console.log('timersData: ', timersData);


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
                
                console.log('Updated with the StrapiID: %d', updatedTimer.id);

                return updatedTimer;
            } else {
                // Timer existiert nicht, erstellen Sie einen neuen
                delete timerData.id; 
                const newTimer = await strapi.entityService.create('api::countdown-timer.countdown-timer', {
                    data: timerData // Verwenden Sie das timerData-Objekt, um ein neues Objekt zu erstellen
                });

                console.log('Created: %d', newTimer.id);
                return newTimer;
            }
        }));
    }
  }));