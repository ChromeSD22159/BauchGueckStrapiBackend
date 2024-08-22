
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::medication-plan.medication-plan', ({ strapi }) => ({
    ...createCoreController('api::medication-plan.medication-plan').actions, // Include default actions

    async deleteMedicationPlans(ctx) {
        try {
            const args = ctx.request.body;

            const deletedMedicationPlans = await strapi.entityService.deleteMany('api::medication-plan.medication-plan', {
                filters: {
                    userID: { $in: args }, 
                },
            });

            ctx.body = deletedMedicationPlans;
        } catch (error) {
            console.error('Error deleting medication plans:', error.message); 
            ctx.throw(500, 'An error occurred while deleting medication plans');
        }
    },

    async getListByUserId(ctx) {
        try {
            const userId = ctx.query.userId;

            const medicationPlans = await strapi.entityService.findMany('api::medication-plan.medication-plan', {
                filters: {
                    userId: userId, 
                },
            });

            ctx.body = medicationPlans;
        } catch (error) {
            console.error('Error fetching medication plans by user ID:', error); 
            ctx.throw(500, 'An error occurred while fetching medication plans'); 
        }
    },

    async updateOrInsert(ctx) {
        try {
            const medicationPlansList = ctx.request.body;

            const results = await Promise.all(medicationPlansList.map(async (receivedMedicationPlan) => {
                const { medicationPlanId } = receivedMedicationPlan; // Assuming you have a unique identifier for medication plans

                const existingMedicationPlan = await strapi.db.query('api::medication-plan.medication-plan').findOne({
                    where: { medicationPlanId: medicationPlanId },
                });

                if (existingMedicationPlan) {
                    receivedMedicationPlan.id = existingMedicationPlan.id;

                    const updatedMedicationPlan = await strapi.entityService.update('api::medication-plan.medication-plan', existingMedicationPlan.id, {
                        data: receivedMedicationPlan,
                    });

                    return updatedMedicationPlan;
                } else {
                    delete receivedMedicationPlan.id; 
                    const newMedicationPlan = await strapi.entityService.create('api::medication-plan.medication-plan', {
                        data: receivedMedicationPlan,
                    });

                    return newMedicationPlan;
                }
            }));

            ctx.body = results; 
        } catch (error) {
            console.error('Error updating or inserting medication plan:', error.message); 
            ctx.throw(500, 'An error occurred while updating or inserting medication plan');
        }
    },
}));