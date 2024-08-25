const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::medication.medication', ({ strapi }) => ({
    async softDeleteMedication(ctx) {
      try {
        const medicationsData = ctx.request.body;
  
        const results = await Promise.all(medicationsData.map(async (medicationData) => {
          const { medicationId } = medicationData;
  
          const existingMedication = await strapi.db.query('api::medication.medication').findOne({
            where: { medicationId: medicationId, isDeleted: false },
          });
  
          if (existingMedication) {
            const updatedMedication = await strapi.entityService.update('api::medication.medication', existingMedication.id, {
              data: { isDeleted: true }
            });
  
            strapi.log.debug('Medication with StrapiID %d als gelöscht markiert', updatedMedication.id);
            return { success: true, deletedMedicationId: updatedMedication.id };
          } else {
            strapi.log.debug('Medication mit medicationId %s nicht gefunden oder bereits gelöscht', medicationId);
            return { success: false, error: 'Medication nicht gefunden oder bereits gelöscht' };
          }
        }));
  
        return results;
      } catch (error) {
        strapi.log.error('Fehler beim Soft-Delete des Medication:', error);
        return { success: false, error: 'Fehler beim Löschen des Medication' };
      }
    },
  
    async deleteSoftDeletedMedications() {
      try {
        const softDeletedMedications = await strapi.entityService.findMany('api::medication.medication', {
          filters: { isDeleted: true },
        });
  
        const deletePromises = softDeletedMedications.map(medication =>
          strapi.entityService.delete('api::medication.medication', medication.id)
        );
        await Promise.all(deletePromises);
  
        strapi.log.info(`${softDeletedMedications.length} soft-deleted Medications wurden endgültig gelöscht.`);
      } catch (error) {
        strapi.log.error('Fehler beim Löschen von soft-deleted Medications:', error);
      }
    },
  
    async getMedicationListByUserId(ctx) {
      try {
        const userId = userIdToString(ctx.query.userId);
  
        const medications = await strapi.entityService.findMany('api::medication.medication', {
          filters: {
            userId: { $eq: userId },
          },
        });
  
        ctx.body = medications;
      } catch (error) {
        console.error('Error fetching medications by user ID:', error);
        ctx.throw(500, 'An error occurred while fetching medications');
      }
    },
  
    async updateOrInsert(ctx) {
      try {
        const medicationsData = ctx.request.body;
  
        strapi.log.debug('Filtered: %d', medicationsData.length);
  
        const results = await Promise.all(medicationsData.map(async (medicationData) => {
          const { medicationId } = medicationData;
  
          const existingMedication = await strapi.db.query('api::medication.medication').findOne({
            where: { medicationId: medicationId, isDeleted: false },
          });
  
          if (existingMedication) {
            medicationData.id = existingMedication.id;
  
            const updatedMedication = await strapi.entityService.update('api::medication.medication', existingMedication.id, {
              data: medicationData 
            });
  
            strapi.log.debug('Updated with the StrapiID: %d', updatedMedication.id);
            return updatedMedication;
          } else {
            delete medicationData.id;
            const newMedication = await strapi.entityService.create('api::medication.medication', {
              data: medicationData 
            });
  
            strapi.log.debug('Created: %d', newMedication.id);
            return newMedication;
          }
        }));
  
        await this.deleteSoftDeletedMedications();
  
        return results;
      } catch (error) {
        strapi.log.error('Error update/insert medications:', error);
        ctx.throw(500, 'An error occurred while updating/inserting medications');
      }
    },
  
    async updateRemoteData(ctx) {
      const medications = ctx.request.body;
  
      const deletedMedications = [];
  
      for (const medication of medications) {
        const { medicationId, userId, updatedAtOnDevice, isDeleted } = medication;
  
        if (isDeleted) {
          deletedMedications.push({ medicationId, userId });
  
          await strapi.db.query('api::medication.medication').delete({
            where: { medicationId, userId }
          });
        } else {
          const existingEntry = await strapi.db.query('api::medication.medication').findOne({
            where: { medicationId, userId }
          });
  
          if (existingEntry) {
            await strapi.db.query('api::medication.medication').update({
              where: { id: existingEntry.id },
              data: { updatedAtOnDevice }
            });
          } else {
            await strapi.db.query('api::medication.medication').create({
              data: { medicationId, userId, updatedAtOnDevice, isDeleted }
            });
          }
        }
      }
  
      ctx.send({
        message: 'Sync completed successfully',
        deletedMedications: deletedMedications
      });
    },

    async fetchMedicationsAfterTimeStamp(ctx) {
      try {
        const userId = userIdToString(ctx.query.userId);
        const timeStamp = stringToInteger(ctx.query.timeStamp);

        let filter = {
            userId: { $eq: userId },
            updatedAtOnDevice: { $gt: timeStamp }
        }
    
        const weights = await strapi.entityService.findMany('api::medication.medication', {
          filters: filter,
        });
    
        if (weights.length === 0) {
          ctx.body = [];
        } else {
          ctx.body = weights;
        }
      } catch (error) {
            strapi.log.error('Error fetching weights:', error);
            ctx.status = 500;
            ctx.body = { error: 'An error occurred while fetching weights' };
      }
    },
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