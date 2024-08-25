const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::countdown-timer.countdown-timer', ({
    strapi
  }) => ({
    ...createCoreController('api::countdown-timer.countdown-timer').actions,
    
    async softDeleteTimer(ctx) {
        try {
            const timersData = ctx.request.body;

            const results = await Promise.all(timersData.map(async (timerData) => {
                const { timerId } = timerData;

                // Suche nach einem existierenden Timer, der noch nicht gelöscht wurde
                const existingTimer = await strapi.db.query('api::countdown-timer.countdown-timer').findOne({
                    where: { timerId: timerId, isDeleted: false },
                });
        
                if (existingTimer) {
                // Timer gefunden, markiere ihn als gelöscht
                    const updatedTimer = await strapi.entityService.update('api::countdown-timer.countdown-timer', existingTimer.id, {
                        data: { isDeleted: true } 
                    });
        
                    strapi.log.debug('Timer mit StrapiID %d als gelöscht markiert', updatedTimer.id);
                    return { success: true, deletedTimerId: updatedTimer.id };
                } else {
                    // Timer nicht gefunden oder bereits gelöscht
                    strapi.log.debug('Timer mit timerId %s nicht gefunden oder bereits gelöscht', timerId);
                    return { success: false, error: 'Timer nicht gefunden oder bereits gelöscht' };
                }
            }))
      
            return results
        } catch (error) {
          strapi.log.error('Fehler beim Soft-Delete des Timers:', error);
          return { success: false, error: 'Fehler beim Löschen des Timers' };
        }
    },

    async deleteSoftDeletedTimers() {
        try {
            // Finde alle Timer, die als gelöscht markiert sind
            const softDeletedTimers = await strapi.entityService.findMany('api::countdown-timer.countdown-timer', {
                filters: { isDeleted: true },
            });
      
            // Lösche jeden gefundenen Timer physisch
            const deletePromises = softDeletedTimers.map(timer => 
                strapi.entityService.delete('api::countdown-timer.countdown-timer', timer.id)
            );
            await Promise.all(deletePromises);
      
            strapi.log.info(`${softDeletedTimers.length} soft-deleted Timer wurden endgültig gelöscht.`);

            } catch (error) {
                strapi.log.error('Fehler beim Löschen von soft-deleted Timern:', error);
            }
      },
    
    async getTimerListByUserId(ctx) {
        try {
          const userId = ctx.query.userId;
    
          const timers = await strapi.entityService.findMany('api::countdown-timer.countdown-timer', {
            filters: {
              userId: userIdToString(userId),
            },
          });
    
          ctx.body = timers;
        } catch (error) {
          console.error('Error fetching timers by user ID:', error); // Log the error for debugging
          ctx.throw(500, 'An error occurred while fetching timers'); // More specific error message
        }
    },

    async updateOrInsert(ctx) {
        
        try {
            const timersData = ctx.request.body;

            strapi.log.debug('Filtered: %d', timersData.length);

            const results = await Promise.all(timersData.map(async (timerData) => {
                const { timerId } = timerData;
            
                const existingTimer = await strapi.db.query('api::countdown-timer.countdown-timer').findOne({
                    where: { timerId: timerId, isDeleted: false },
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

             // Rufe deleteSoftDeletedTimers auf
            await this.deleteSoftDeletedTimers();

            return results
        } catch (error) {
            strapi.log.error('Error update/insert timers:', error); // Log the error for debugging
            ctx.throw(500, 'An error occurred while deleting timers');
        }

    },

    async updateRemoteData(ctx) {
        const timers = ctx.request.body;
        
        const deletedTimers = [];
    
        for (const timer of timers) {
            const { timerId, userId, updatedOnDevice, isDeleted } = timer;
    
            if (isDeleted) {
                    // Füge den Timer zur Liste der gelöschten Einträge hinzu
                    deletedTimers.push({ timerId, userId });

                    // Lösche alle Einträge mit der passenden timerId und userId
                    await strapi.db.query('api::countdown-timer.countdown-timer').delete({
                        where: { timerId, userId }
                    });
            } else {
                    // Prüfe, ob es einen Eintrag mit der gegebenen timerId und userId gibt
                    const existingEntry = await strapi.db.query('api::countdown-timer.countdown-timer').findOne({
                        where: { timerId, userId }
                    });
            
                    if (existingEntry) {
                        // Aktualisiere den bestehenden Eintrag
                        await strapi.db.query('api::countdown-timer.countdown-timer').update({
                            where: { id: existingEntry.id },
                            data: { updatedOnDevice }
                        });
                    } else {
                        // Erstelle einen neuen Eintrag
                        await strapi.db.query('api::countdown-timer.countdown-timer').create({
                            data: { timerId, userId, updatedOnDevice, isDeleted }
                        });
                    }
            }
        }
    
        // Sende den Response zurück mit den gelöschten Einträgen
        ctx.send({
            message: 'Sync completed successfully',
            deletedTimers: deletedTimers
        });
    },

    async fetchTimersAfterTimeStamp(ctx) {
        try {
            const userId = userIdToString(ctx.query.userId);
            const timeStamp = stringToInteger(ctx.query.timeStamp);

            const timers = await strapi.entityService.findMany('api::countdown-timer.countdown-timer', {
                filters: {
                    userId: { $eq: userId },
                    updatedAtOnDevice: { $gt: timeStamp}
                },
            });
      
            if (timers.length === 0) {
                ctx.body = [];
            } else {
                ctx.body = timers;
            }

            //ctx.body = timers;
        } catch (error) {
            strapi.log.error('Fehler beim Löschen von soft-deleted Timern:', error);
        }
    }

  }));

function stringToInteger(str) {
    try {
        if (/^-?\d+$/.test(str)) {
            return parseInt(str)
        } else {
            throw new Error("Invalid input: not a valid integer representation");
        }
    } catch (error) {
        console.error("Error converting string to BigInt:", error);
        return null; 
    }
}

function userIdToString(str) {
    try {
        return String(str)
    } catch (error) {
        console.error("Error converting string to BigInt:", error);
        return null; 
    }
}

function unixToISO(timestampString) {
    const timestamp = parseInt(timestampString, 10);
    const date = new Date(timestamp);
    return date.toISOString(); 
}