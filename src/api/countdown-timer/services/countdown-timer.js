'use strict';

/**
 * countdown-timer service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::countdown-timer.countdown-timer');
