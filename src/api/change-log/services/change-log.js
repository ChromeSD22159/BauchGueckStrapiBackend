'use strict';

/**
 * change-log service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::change-log.change-log');
