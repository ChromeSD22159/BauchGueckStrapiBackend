const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::weight.weight', ({ strapi }) => ({
    async softDeleteWeight(ctx) {
      try {
        const weightsData = ctx.request.body;
  
        const results = await Promise.all(weightsData.map(async (weightData) => {
          const { weightId } = weightData;
  
          const existingWeight = await strapi.db.query('api::weight.weight').findOne({
            where: { weightId: weightId, isDeleted: false },
          });
  
          if (existingWeight) {
            const updatedWeight = await strapi.entityService.update('api::weight.weight', existingWeight.id, {
              data: { isDeleted: true }
            });
  
            strapi.log.debug('Weight with StrapiID %d als gelöscht markiert', updatedWeight.id);
            return { success: true, deletedWeightId: updatedWeight.id };
          } else {
            strapi.log.debug('Weight mit weightId %s nicht gefunden oder bereits gelöscht', weightId);
            return { success: false, error: 'Weight nicht gefunden oder bereits gelöscht' };
          }
        }));
  
        return results;
      } catch (error) {
        strapi.log.error('Fehler beim Soft-Delete des Weight:', error);
        return { success: false, error: 'Fehler beim Löschen des Weight' };
      }
    },
  
    async deleteSoftDeletedWeights() {
      try {
        const softDeletedWeights = await strapi.entityService.findMany('api::weight.weight', {
          filters: { isDeleted: true },
        });
  
        const deletePromises = softDeletedWeights.map(weight =>
          strapi.entityService.delete('api::weight.weight', weight.id)
        );
        await Promise.all(deletePromises);
  
        strapi.log.info(`${softDeletedWeights.length} soft-deleted Weights wurden endgültig gelöscht.`);
      } catch (error) {
        strapi.log.error('Fehler beim Löschen von soft-deleted Weights:', error);
      }
    },
  
    async getWeightListByUserId(ctx) {
      try {
        const userId = userIdToString(ctx.query.userId);
  
        const weights = await strapi.entityService.findMany('api::weight.weight', {
          filters: {
            userId: { $eq: userId },
          },
        });
  
        ctx.body = weights;
      } catch (error) {
        console.error('Error fetching weights by user ID:', error);
        ctx.throw(500, 'An error occurred while fetching weights');
      }
    },
  
    async updateOrInsert(ctx) {
      try {
        const weightsData = ctx.request.body;
  
        strapi.log.debug('Filtered: %d', weightsData.length);
  
        const results = await Promise.all(weightsData.map(async (weightData) => {
          const { weightId } = weightData;
  
          const existingWeight = await strapi.db.query('api::weight.weight').findOne({
            where: { weightId: weightId, isDeleted: false },
          });
  
          if (existingWeight) {
            weightData.id = existingWeight.id;
  
            const updatedWeight = await strapi.entityService.update('api::weight.weight', existingWeight.id, {
              data: weightData 
            });
  
            strapi.log.debug('Updated with the StrapiID: %d', updatedWeight.id);
            return updatedWeight;
          } else {
            delete weightData.id;
            const newWeight = await strapi.entityService.create('api::weight.weight', {
              data: weightData 
            });
  
            strapi.log.debug('Created: %d', newWeight.id);
            return newWeight;
          }
        }));
  
        await this.deleteSoftDeletedWeights();
  
        return results;
      } catch (error) {
        strapi.log.error('Error update/insert weights:', error);
        ctx.throw(500, 'An error occurred while updating/inserting weights');
      }
    },
  
    async updateRemoteData(ctx) {
      const weights = ctx.request.body;
  
      const deletedWeights = [];
  
      for (const weight of weights) {
        const { weightId, userId, updatedAtOnDevice, isDeleted } = weight;
  
        if (isDeleted) {
          deletedWeights.push({ weightId, userId });
  
          await strapi.db.query('api::weight.weight').delete({
            where: { weightId, userId }
          });
        } else {
          const existingEntry = await strapi.db.query('api::weight.weight').findOne({
            where: { weightId, userId }
          });
  
          if (existingEntry) {
            await strapi.db.query('api::weight.weight').update({
              where: { id: existingEntry.id },
              data: { updatedAtOnDevice }
            });
          } else {
            await strapi.db.query('api::weight.weight').create({
              data: { weightId, userId, updatedAtOnDevice, isDeleted }
            });
          }
        }
      }
  
      ctx.send({
        message: 'Sync completed successfully',
        deletedWeights: deletedWeights
      });
    },
  
    async fetchWeightsAfterTimeStamp(ctx) {
      try {
        const userId = userIdToString(ctx.query.userId);
        const timeStamp = stringToInteger(ctx.query.timeStamp);
  
        const weights = await strapi.entityService.findMany('api::weight.weight', {
          filters: {
            userId: { $eq: userId },
            updatedAtOnDevice: { $gt: timeStamp }
          },
        });
  
        if (weights.length === 0) {
          ctx.status = 404;
          ctx.body = { 
              error: 'No data to sync', 
              message: 'No weights found after the specified timestamp' 
          };
        } else {
            ctx.body = weights;
        }
      } catch (error) {
        strapi.log.error('Error fetching weights:', error);
        ctx.status = 500;
        ctx.body = { error: 'An error occurred while fetching weights' };
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