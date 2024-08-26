'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::time-stamp.time-stamp', ({ strapi }) => ({
  ...createCoreController('api::time-stamp.time-stamp').actions,
    async getCurrentTimeStamp(ctx) {
        try {
          const currentTimestamp = Date.now();

          const hoursOffset = parseInt(ctx.query.hours) || 2;

          const offsetMilliseconds = hoursOffset * 60 * 60 * 1000;

            ctx.body = {
              previewTimeSamp: currentTimestamp - offsetMilliseconds,
              currentTimestamp: currentTimestamp,
              futureTimeStamp: currentTimestamp + offsetMilliseconds
            };
        } catch(error) {

        }
    }
}));

