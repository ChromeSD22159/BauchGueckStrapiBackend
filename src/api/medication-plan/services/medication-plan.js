'use strict';

/**
 * medication-plan service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::medication-plan.medication-plan');
