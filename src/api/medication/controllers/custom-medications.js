const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::medication.medication',   
 ({ strapi }) => ({
    ...createCoreController('api::medication.medication').actions, // Include default actions

    async deleteMedications(ctx) {
        try {
            const args = ctx.request.body;

            const deletedMedications = await strapi.entityService.deleteMany('api::medication.medication', {
                filters: {
                    userID: { $in: args }, 
                },
            });

            ctx.body = deletedMedications;
        } catch (error) {
            console.error('Error deleting medications:', error.message); 
            ctx.throw(500, 'An error occurred while deleting medications');
        }
    },

    async getListByUserId(ctx) {
        try {
            const userId = ctx.query.userId;

            const medications = await strapi.entityService.findMany('api::medication.medication', {
                filters: {
                    userId: userId, 
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
            const medicationsList = ctx.request.body;

            const results = await Promise.all(medicationsList.map(async (receivedMedication) => {
                const { medicationId } = receivedMedication; // Assuming you have a unique identifier for medications

                const existingMedication = await strapi.db.query('api::medication.medication').findOne({
                    where: { medicationId: medicationId },
                });

                if (existingMedication) {
                    receivedMedication.id = existingMedication.id;

                    const updatedMedication = await strapi.entityService.update('api::medication.medication', existingMedication.id, {
                        data: receivedMedication,
                    });

                    return updatedMedication;
                } else {
                    delete receivedMedication.id; 
                    const newMedication = await strapi.entityService.create('api::medication.medication', {
                        data: receivedMedication,
                    });

                    return newMedication;
                }
            }));

            ctx.body = results; 
        } catch (error) {
            console.error('Error updating or inserting medication:', error.message); 
            ctx.throw(500, 'An error occurred while updating or inserting medication');
        }
    },
}));