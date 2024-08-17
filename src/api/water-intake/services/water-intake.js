'use strict';

/**
 * water-intake service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::water-intake.water-intake');
