'use strict';

/**
 * medication controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::medication.medication');
