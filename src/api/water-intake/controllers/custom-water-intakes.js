const { createCoreController } = require('@strapi/strapi').factories;

const {
  stringToInteger,
  userIdToString, validateUserId, validateTimerStamp
} = require('../../../utils/validation');

module.exports = createCoreController('api::water-intake.water-intake', ({ strapi }) => ({
    async softDeleteWaterIntake(ctx) {
      try {
        const waterIntakesData = ctx.request.body;

        const results = await Promise.all(waterIntakesData.map(async (waterIntakeData) => {
          const { waterIntakeId } = waterIntakeData;

          const existingWaterIntake = await strapi.db.query('api::water-intake.water-intake').findOne({
            where: { waterIntakeId: waterIntakeId, isDeleted: false },
          });

          if (existingWaterIntake) {
            const updatedWaterIntake = await strapi.entityService.update('api::water-intake.water-intake', existingWaterIntake.id, {
              data: { isDeleted: true }
            });

            strapi.log.debug('WaterIntake with StrapiID %d als gelöscht markiert', updatedWaterIntake.id);
            return { success: true, deletedWaterIntakeId: updatedWaterIntake.id };
          } else {
            strapi.log.debug('WaterIntake mit waterIntakeId %s nicht gefunden oder bereits gelöscht', waterIntakeId);
            return { success: false, error: 'WaterIntake nicht gefunden oder bereits gelöscht' };
          }
        }));

        return results;
      } catch (error) {
        strapi.log.error('Fehler beim Soft-Delete des WaterIntake:', error);
        return { success: false, error: 'Fehler beim Löschen des WaterIntake' };
      }
    },

    async deleteSoftDeletedWaterIntakes() {
      try {
        const softDeletedWaterIntakes = await strapi.entityService.findMany('api::water-intake.water-intake', {
          filters: { isDeleted: true },
        });

        const deletePromises = softDeletedWaterIntakes.map(waterIntake =>
          strapi.entityService.delete('api::water-intake.water-intake', waterIntake.id)
        );
        await Promise.all(deletePromises);

        strapi.log.info(`${softDeletedWaterIntakes.length} soft-deleted WaterIntakes wurden endgültig gelöscht.`);
      } catch (error) {
        strapi.log.error('Fehler beim Löschen von soft-deleted WaterIntakes:', error);
      }
    },

    async getWaterIntakeListByUserId(ctx) {
      try {
        const userId = userIdToString(ctx.query.userId);

        const waterIntakes = await strapi.entityService.findMany('api::water-intake.water-intake', {
          filters: {
            userId: { $eq: userId },
          },
        });

        ctx.body = waterIntakes;
      } catch (error) {
        console.error('Error fetching water intakes by user ID:', error);
        ctx.throw(500, 'An error occurred while fetching water intakes');
      }
    },

    async updateOrInsert(ctx) {
      try {
        const waterIntakesData = ctx.request.body;

        strapi.log.debug('Filtered: %d', waterIntakesData.length);

        const results = await Promise.all(waterIntakesData.map(async (waterIntakeData) => {
          const { waterIntakeId } = waterIntakeData;

          const existingWaterIntake = await strapi.db.query('api::water-intake.water-intake').findOne({
            where: { waterIntakeId: waterIntakeId, isDeleted: false },
          });

          if (existingWaterIntake) {
            weightData.id = existingWaterIntake.id;

            const updatedWaterIntake = await strapi.entityService.update('api::water-intake.water-intake', existingWaterIntake.id, {
              data: waterIntakeData
            });

            strapi.log.debug('Updated with the StrapiID: %d', updatedWaterIntake.id);
            return updatedWaterIntake;
          } else {
            delete waterIntakeData.id;
            const newWaterIntake = await strapi.entityService.create('api::water-intake.water-intake', {
              data: waterIntakeData
            });

            strapi.log.debug('Created: %d', newWaterIntake.id);
            return newWaterIntake;
          }
        }));

        await this.deleteSoftDeletedWaterIntakes();

        return results;
      } catch (error) {
        strapi.log.error('Error update/insert water intakes:', error);
        ctx.throw(500, 'An error occurred while updating/inserting water intakes');
      }
    },

    async updateRemoteData(ctx) {
        const waterIntakesFromApp = ctx.request.body;
        const deletedWaterIntakes = [];

        for (const waterIntakeData of waterIntakesFromApp) {
          // 1. Suche nach einem vorhandenen WaterIntake
          let waterIntakeOrNull = await strapi.db.query('api::water-intake.water-intake').findOne({
              where: {
                  waterIntakeId: waterIntakeData.waterIntakeId,
                  userId: waterIntakeData.userId
              },
          });

          // 2. Wenn das gesendete WaterIntake gelöscht ist, dann soft delete in Strapi
          if (waterIntakeData.isDeleted) {
              if (waterIntakeOrNull) {
                  // Soft delete durch Markierung von isDeleted auf true
                  await strapi.entityService.update('api::water-intake.water-intake', waterIntakeOrNull.id, {
                    data: { isDeleted: true },
                  });
                  deletedWaterIntakes.push({ waterIntakeId: waterIntakeData.waterIntakeId, userId: waterIntakeData.userId });
              }
              continue;
          }

          // 3. Wenn WaterIntake vorhanden, aktualisiere die Einträge
          if (waterIntakeOrNull) {
              const floatValue = parseFloat(waterIntakeData.value);
              await strapi.db.query('api::water-intake.water-intake').update({
                  where: { id: waterIntakeOrNull.id },
                  data: { ...waterIntakeData, value: floatValue, isDeleted: false }, // Aktualisieren, isDeleted zurücksetzen
              });
          } else {
              // 4. Wenn WaterIntake nicht vorhanden, erstelle einen neuen Eintrag
              delete waterIntakeData.id
              const floatValue = parseFloat(waterIntakeData.value);
              await strapi.db.query('api::water-intake.water-intake').create({
                  data: { ...waterIntakeData, value: floatValue, isDeleted: false }, // Setze isDeleted auf false
              });
          }
        }

        ctx.send({
          message: 'Sync completed successfully',
          deletedWaterIntakes: deletedWaterIntakes
        });
    },

    async fetchWaterIntakesAfterTimeStamp(ctx) {
      try {
        if (!validateUserId(ctx)) {
            return;
        }

        const userId = userIdToString(ctx.query.userId);

        const timeStamp = validateTimerStamp(ctx)

        const waterIntakes = await strapi.entityService.findMany('api::water-intake.water-intake', {
          filters: {
              userId: { $eq: userId },
              updatedAtOnDevice: { $gt: timeStamp }
          },
        });


        if (waterIntakes.length === 0) {
            ctx.status = 430;
            ctx.body = {
              error: 'No data to sync',
              message: 'No waterIntakes found after the specified timestamp'
            };
        } else {
            ctx.body = waterIntakes;
        }
      } catch (error) {
        strapi.log.error('Error fetching water intakes:', error);
        ctx.status = 500;
        ctx.body = { error: 'An error occurred while fetching water intakes' };
      }
    },
  }));
