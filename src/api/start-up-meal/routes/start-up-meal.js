'use strict';

/**
 * start-up-meal router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::start-up-meal.start-up-meal');

module.exports = {
  routes: [
    {
      method: "GET",
      path: "/getStartUpMeals",
      handler: "start-up-meal.getStartUpMeals",
      config: {
        policies: []
      }
    },
    {
      method: "GET",
      path: "/getStartUpMealsCount",
      handler: "start-up-meal.getStartUpMealsCount",
      config: {
        policies: []
      }
    }
  ]
}
