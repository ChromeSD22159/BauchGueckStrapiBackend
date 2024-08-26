'use strict';

/**
 * countdown-timer controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::countdown-timer.countdown-timer',    ({ strapi }) => ({
    ...createCoreController('api::countdown-timer.countdown-timer').actions,

     // Add your custom lifecycle hooks
     async beforeCreate(ctx) {
        strapi.log.info('Content-Type:', ctx.is('application/json')); 
        strapi.log.info('Origin:', ctx.get('origin'));
        strapi.log.info('Request Body (before):', ctx.request.body);

        if (ctx.is('application/json') && ctx.get('origin') === 'http://localhost:1337/admin') {
            ctx.request.body.data.updatedAtOnDevice = Date.now();
        }
     },
   
     async beforeUpdate(ctx) {
        strapi.log.info('Content-Type:', ctx.is('application/json')); 
        strapi.log.info('Origin:', ctx.get('origin'));
        strapi.log.info('Request Body (before):', ctx.request.body);

        if (ctx.is('application/json') && ctx.get('origin') === 'http://localhost:1337/admin') {
            ctx.request.body.data.updatedAtOnDevice = Date.now();
        }
     }
   }));