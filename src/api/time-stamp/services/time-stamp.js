'use strict';

/**
 * time-stamp service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::time-stamp.time-stamp');
