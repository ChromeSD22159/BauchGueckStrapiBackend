'use strict';

/**
 * intake-status service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::intake-status.intake-status');
