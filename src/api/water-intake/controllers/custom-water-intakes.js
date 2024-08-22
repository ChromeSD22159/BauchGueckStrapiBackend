const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::water-intake.water-intake', ({ strapi }) => ({
    ...createCoreController('api::water-intake.water-intake').actions, // Include default actions

    async deleteWaterIntakes(ctx) {
        try {
            const args = ctx.request.body;

            const deletedWaterIntakes = await strapi.entityService.deleteMany('api::water-intake.water-intake', {
                filters: {
                    userID: { $in: args }, 
                },
            });

            ctx.body = deletedWaterIntakes;
        } catch (error) {
            console.error('Error deleting water intakes:', error.message); 
            ctx.throw(500, 'An error occurred while deleting water intakes');
        }
    },

    async getListByUserId(ctx) {
        try {
            const userId = ctx.query.userId;

            const waterIntakes = await strapi.entityService.findMany('api::water-intake.water-intake', {
                filters: {
                    userId: userId, 
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
            const waterIntakesList = ctx.request.body;

            const results = await Promise.all(waterIntakesList.map(async (receivedWaterIntake) => {
                const { waterIntakeId } = receivedWaterIntake; // Assuming you have a unique identifier for water intakes

                const existingWaterIntake = await strapi.db.query('api::water-intake.water-intake').findOne({
                    where: { waterIntakeId: waterIntakeId },
                });

                if (existingWaterIntake) {
                    receivedWaterIntake.id = existingWaterIntake.id;

                    const updatedWaterIntake = await strapi.entityService.update('api::water-intake.water-intake', existingWaterIntake.id, {
                        data: receivedWaterIntake,
                    });

                    return updatedWaterIntake;
                } else {
                    delete receivedWaterIntake.id; 
                    const newWaterIntake = await strapi.entityService.create('api::water-intake.water-intake', {
                        data: receivedWaterIntake,
                    });

                    return newWaterIntake;
                }
            }));

            ctx.body = results; 
        } catch (error) {
            console.error('Error updating or inserting water intake:', error.message); 
            ctx.throw(500, 'An error occurred while updating or inserting water intake');
        }
    },
}));