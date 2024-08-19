'use strict';

/**
 * countdown-timer router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::countdown-timer.countdown-timer');

module.exports = {
    routes: [
      {
        method: 'POST',
        path: '/countdown-timers/update-or-insert',
        handler: 'countdown-timer-update-or-insert.updateOrInsert',
        config: {
          policies: []
        }
      }
    ]
  }