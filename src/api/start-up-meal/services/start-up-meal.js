'use strict';

/**
 * start-up-meal service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::start-up-meal.start-up-meal');
