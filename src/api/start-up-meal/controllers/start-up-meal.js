'use strict';

/**
 * start-up-meal controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const model = "api::start-up-meal.start-up-meal"

module.exports = createCoreController(model, ({ strapi }) => ({
  ...createCoreController(model).actions,
  async getStartUpMeals(ctx) {
      let mealModel = "api::meal.meal"
      try {

          let startUpIdsOrNull = await strapi.db.query(model).findOne();

          let ids = startUpIdsOrNull.meals.split(",");

          let meals = [];

          for (const id of ids) {
              let mealById = await strapi.db.query(mealModel).findOne({
                  where: { id: id },
                  populate: {
                      ingredients: {  // Die Dynamic Zone "ingredients" wird beachtet
                          populate: ['name', 'amount', 'unit'],
                      },
                      mainImage: true,
                      category: true
                  }
              });

              meals.push(mealById);
          }

          ctx.body = meals;

      } catch(error) {
        ctx.badRequest("An error occurred while fetching random meals", error);
      }
  },
  async getStartUpMealsCount(ctx) {
      let mealModel = "api::meal.meal"
      try {

          let startUpIdsOrNull = await strapi.db.query(model).findOne();

          let ids = startUpIdsOrNull.meals.split(",");

          let meals = [];

          for (const id of ids) {
            let mealById = await strapi.db.query(mealModel).findOne({
              where: { id: id },
              populate: { id }
            });

            meals.push(mealById);
          }

          if (meals && Array.isArray(meals)) {
              ctx.body = {
                  length: meals.length
              };
          } else {
              ctx.body = { length: 0 };
          }

      } catch(error) {
          ctx.badRequest("An error occurred while fetching random meals", error);
      }
  }
}));
