const { createCoreController } = require('@strapi/strapi').factories;

const {
  validateUserId,
  validateTimerStamp,
  validateRequestBodyIsArray,
  removeTimestamps,
  stringToInteger,
  userIdToString
} = require('../../../utils/validation');


module.exports = createCoreController('api::medication.medication', ({
    strapi
  }) => ({
   
}));


