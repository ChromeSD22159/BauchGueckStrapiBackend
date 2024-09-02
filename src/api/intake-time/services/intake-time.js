'use strict';

/**
 * intake-time service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::intake-time.intake-time');
