const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::weight.weight', ({
    strapi
  }) => ({
    ...createCoreController('api::weight.weight').actions,
    
    async deleteWeights(ctx) {
        try {
            const args = ctx.request.body;

            const deletedWeights = await strapi.entityService.deleteMany('api::weight.weight', {
            filters: {
                userID: { $in: args },  
            },
            });

            ctx.body = deletedWeights;
        } catch (error) {
            console.error('Error deleting weights:', error.message); 
            ctx.throw(500, 'An error occurred while deleting weights');
        }
    },
    
    async getListByUserId(ctx) {
        try {
          const userId = ctx.query.userId;
    
          const timers = await strapi.entityService.findMany('api::weight.weight', {
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

        try {
            const weightsList = ctx.request.body;

            const results = await Promise.all(weightsList.map(async (receivedWeight) => {
                const { weightId } = receivedWeight;
            
                const existingWeight = await strapi.db.query('api::weight.weight').findOne({
                    where: { weightId: weightId },
                });
      
                if (existingWeight) {
                  receivedWeight.id = existingWeight.id
      
                    const updatedWeight = await strapi.entityService.update('api::weight.weight', existingWeight.id, {
                        data: receivedWeight
                    });
      
                    return updatedWeight;
                } else {
      
                    delete receivedWeight.id; 
                    const newWeight = await strapi.entityService.create('api::weight.weight', {
                        data: receivedWeight
                    });
      
                    return newWeight;
                }
            }));
        } catch (error) {
            console.error('Error updating or inserting weight:', error.message); // Log the error message
            ctx.throw(500, 'An error occurred while updating or inserting weight');
        }

  }

  }));