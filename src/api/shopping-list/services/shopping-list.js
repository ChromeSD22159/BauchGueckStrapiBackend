'use strict';

/**
 * shopping-list service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::shopping-list.shopping-list');
