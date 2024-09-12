const {
  handleEmptyUserParameter,
  handleSearchQueryMustContain3Chars,
  removeTimestamps, userIdToString, validateTimerStamp, handleEmptyResponseBody, removeComponentFieldFromIngredients
} = require("../../../utils/validation");

const {
  calculateNutritionForRecipe, generateRecipe
} = require("../../../utils/GoogleAI");

const mealModel = "api::meal.meal"
const recipeCategory = "api::recipe-category.recipe-category";

module.exports = {
  async searchRecipes(ctx) {
    // Überprüfen, ob die User-ID leer ist
    if (handleEmptyUserParameter(ctx)) return;

    // Überprüfen, ob die Suchabfrage mindestens 3 Zeichen enthält
    if (handleSearchQueryMustContain3Chars(ctx, "No recipe found. You sent less than 3 characters.")) return;

    const userId = ctx.query.userId;
    const searchQuery = ctx.query.searchQuery;

    // Basis-Filter erstellen: Nur öffentliche Rezepte oder private Rezepte des Benutzers
    const filters = {
      $or: [
        { isPrivate: false },
        { userId: userId }
      ]
    };

    // Wenn eine Suchabfrage vorhanden ist, füge sie zu den Filtern hinzu
    if (searchQuery) {
      filters.name = { $contains: searchQuery };
    }

    // Abfrage ausführen und die Ergebnisse zurückgeben
    // Ergebnisse als Antwort senden
    let result = await strapi.entityService.findMany(mealModel, {
      filters: filters,
      populate: {
        ingredients: {  // Die Dynamic Zone "ingredients" wird beachtet
          populate: ['name', 'amount', 'unit'],
        },
        mainImage: true,
        category: true
      }
    });

    // Über jedes Meal-Objekt in der result-Liste iterieren und das "__component"-Feld entfernen
    for (const meal of result) {
        removeComponentFieldFromIngredients(meal);
    }

    ctx.body = removeTimestamps(result);
  },
  async createRecipe(ctx) {
    let createdCategoryId = 0;

    const existingCategory = await strapi.db.query(recipeCategory).findOne({
      where: {
        name: ctx.request.body.category.name,
      },
    });

    if(existingCategory) {
      createdCategoryId = existingCategory.id;
    } else {
      const newCategory = await strapi.db.query(recipeCategory).create({
        data: {
          name: ctx.request.body.category.name,
          ...ctx.request.body.category,
        },
      });
      createdCategoryId = newCategory.id;
    }

    const existingRecipe = await strapi.db.query(mealModel).findOne({
      where: {
        name: ctx.request.body.name,
      },
    });
    if(existingRecipe) {
      ctx.status = 409;
      ctx.body = {
        "status": ctx.status,
        "message": "Rezept mit den Namen existiert bereits!",
      };
    } else {
      const recipe = { ...ctx.request.body };
      delete recipe.id;
      delete recipe.category;
      recipe.category = createdCategoryId;

      let nutrition = await calculateNutritionForRecipe(recipe);

      recipe.protein = nutrition.protein;
      recipe.fat = nutrition.fat
      recipe.sugar = nutrition.carbohydrates
      recipe.kcal = nutrition.calories

      ctx.body = await strapi.db.query(mealModel).create({
          data: recipe,
          populate: {
            category: true,
          },
      });
    }
  },
  async overview(ctx) {
    try {
      const queryCount = ctx.query.count;
      let count = parseInt(queryCount) || 0;

      // 1. Get the total count of meals
      const totalMeals = await strapi.entityService.count(mealModel);

      // 2. Adjust count if it exceeds the total number of meals
      count = Math.min(count, totalMeals);

      // 3. Fetch random meals (if count is greater than 0)
      let randomMeals = [];
      if (count > 0) {
        // Create a Set to store unique random offsets
        const randoms = [];

        while (randoms.length < count && randoms.length < totalMeals) {
          const randomOffset = Math.floor(Math.random() * totalMeals);

          let entityOrNull = await strapi.entityService.findOne(mealModel, randomOffset, {
            populate: {
              ingredients: {  // Die Dynamic Zone "ingredients" wird beachtet
                populate: ['name', 'amount', 'unit'],
              },
              mainImage: true,
              category: true
            }
          });

          if (entityOrNull) { // && !randoms.some(item => item.id === entityOrNull.id)
            randoms.push(entityOrNull);
          }
        }

        randomMeals = randoms
      }

      ctx.body = removeTimestamps(randomMeals);
    } catch (err) {
      ctx.internalServerError('An error occurred while fetching random meals', err);
    }
  },

  async getUpdatedMealEntries(ctx) {
      if (handleEmptyUserParameter(ctx)) return;

      const userId = userIdToString(ctx.query.userId);

      const timeStamp = validateTimerStamp(ctx)

      let result = await strapi.entityService.findMany(mealModel, {
          filters: {
              userId: userId,
              updatedAtOnDevice: { $gt: timeStamp },
          },
          populate: {
              ingredients: {  // Die Dynamic Zone "ingredients" wird beachtet
                  populate: ['name', 'amount', 'unit'],
              },
              mainImage: true,
              category: true
          }
      });

      ctx.body = removeTimestamps(result);

      handleEmptyResponseBody(ctx, 'No Meals found after the specified timestamp')
  },
  async generateRecipe(ctx) {
    ctx.body = await generateRecipe()
  }
}
