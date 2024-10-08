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
    //if (handleSearchQueryMustContain3Chars(ctx, "No recipe found. You sent less than 3 characters.")) return;

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
      delete ctx.request.body.id

      const transformedRecipe = {
          ...ctx.request.body,
          ingredients: ctx.request.body.ingredients.map(item => (
            {
              "__component": "recipe.single-ingredient",
              id: String(item.id),
              name: item.name,
              unit: item.unit,
              amount: item.amount
            }
          ))
      };

      transformedRecipe.protein = 0.0;
      transformedRecipe.fat = 0.0;
      transformedRecipe.sugar = 0.0;
      transformedRecipe.kcal = 0.0;

      const existingCategory = await strapi.db.query(recipeCategory).findOne({
          where: {
              name: transformedRecipe.category.name,
          },
      });

      if(existingCategory) {
          createdCategoryId = existingCategory.id;
      } else {
          const newCategory = await strapi.db.query(recipeCategory).create({
              data: {
                  name: transformedRecipe.category.name,
                  ...transformedRecipe.category,
              },
          });
          createdCategoryId = newCategory.id;
      }

      const existingRecipe = await strapi.db.query(mealModel).findOne({
          where: {
              name: transformedRecipe.name,
          },
      });

      if(existingRecipe) {
          ctx.status = 409;
          ctx.body = {
            "status": ctx.status,
            "message": "Rezept mit den Namen existiert bereits!",
          };
      } else {
          const recipe = { ...transformedRecipe };
          delete recipe.id;
          recipe.category.id = createdCategoryId;

          let nutrition = await calculateNutritionForRecipe(recipe);

          transformedRecipe.protein = nutrition.protein;
          transformedRecipe.fat = nutrition.fat
          transformedRecipe.sugar = nutrition.carbohydrates
          transformedRecipe.kcal = nutrition.calories

          try {
              const created = await strapi.entityService.create(mealModel, {
                  data: transformedRecipe,
                  populate: {
                    ingredients: true,
                    mainImage: true,
                    category: true
                  },
              });

              ctx.status = 201;
              ctx.body = created;
          } catch (error) {
              console.error('Fehler beim Erstellen des Rezepts:', error);
              ctx.status = 500;
              ctx.body = { message: 'Ein interner Fehler ist aufgetreten.' };
          }
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

  // NEW ROUTES
  async getUpdatedRecipesEntries(ctx) {
      const timeStamp = validateTimerStamp(ctx)

      let result = await strapi.entityService.findMany(mealModel, {
          filters: {
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

      handleEmptyResponseBody(ctx, 'No Recipes found after the specified timestamp')
  },
  // NEW ROUTES

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
      ctx.body = await generateRecipe(ctx.query.category, ctx.query.withNutrition)
  }
}
