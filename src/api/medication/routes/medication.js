'use strict';

/**
 * medication router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::medication.medication');
