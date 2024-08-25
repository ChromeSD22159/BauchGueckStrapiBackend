'use strict';

/**
 * time-stamp controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::time-stamp.time-stamp');

module.exports = createCoreController('api::time-stamp.time-stamp', ({ strapi }) => ({
    async getCurrentTimeStamp(ctx) {
        try {
          const currentTimestamp = Date.now();
    
          ctx.body = { "timestamp": currentTimestamp }
        } catch(error) {
    
        }
    }
}));

