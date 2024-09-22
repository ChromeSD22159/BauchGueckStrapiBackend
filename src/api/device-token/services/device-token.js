'use strict';

/**
 * device-token service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::device-token.device-token');
