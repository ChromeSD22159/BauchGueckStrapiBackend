'use strict';

/**
 * medication service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::medication.medication');
