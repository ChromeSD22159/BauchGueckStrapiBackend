'use strict';

/**
 * countdown-timer router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = {
    routes: [
        // STANDARD ROUTES (CRUD)
        {
          method: 'GET',
          path: '/countdown-timers',
          handler: 'api::countdown-timer.countdown-timer.find',
          config: {
            policies: []
          }
        },
        {
          method: 'GET',
          path: '/countdown-timers/:id',
          handler: 'api::countdown-timer.countdown-timer.findOne',
          config: {
            policies: []
          }
        },
        {
          method: 'POST',
          path: '/countdown-timers',
          handler: 'api::countdown-timer.countdown-timer.create',
          config: {
            policies: []
          }
        },
        {
          method: 'PUT',
          path: '/countdown-timers/:id',
          handler: 'api::countdown-timer.countdown-timer.update',
          config: {
            policies: []
          }
        },
        {
          method: 'DELETE',
          path: '/countdown-timers/:id',
          handler: 'api::countdown-timer.countdown-timer.delete',
          config: {
            policies: []
          }
        },
        // END STANDARD ROUTES


        // CUSTOM ROUTES
        {
            method: "POST",
            path: "/timer/updateRemoteData",
            handler: "custom-countdown-timer.updateRemoteData",
            config: {
                policies: []
            }
        },
        {
            method: "GET",
            path: "/timer/fetchItemsAfterTimeStamp",
            handler: "custom-countdown-timer.fetchItemsAfterTimeStamp",
            config: {
                policies: []
            }
        }
        // END CUSTOM ROUTES
    ]
}
