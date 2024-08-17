'use strict';

/**
 * weight service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::weight.weight');
