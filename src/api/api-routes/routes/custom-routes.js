
const publicController = "public-controller."
const medicationController = "medication-controller."
const recipesController = "recipes-controller."
const mealPlanController = "meal-plan-controller."
const shoppingListController = "shopping-list-controller."

module.exports = {
    routes: [
        // Endpoint: https://{{base_url}}/api/getCurrentTimeStamp
        // Description: Retrieves the current, previous, and future timestamps for synchronization purposes.
        // Required:
        //   - Parameters: None
        //   - Optional:
        //     - timeStamp: (integer) - A timestamp to compare against. If not provided, the default is 0.
        // Response:
        //   - previewTimeSamp: (integer) - The previous timestamp.
        //   - currentTimestamp: (integer) - The current timestamp.
        //   - futureTimeStamp: (integer) - The future timestamp.
        GET(publicController, "", "getCurrentTimeStamp"),

        // Endpoint: https://{{base_url}}/api/getApiStatistics
        // Description: Retrieves statistical data about various entities within the application.
        GET(publicController, "", "appStatistics"),

        GET(publicController, "", "generateID"),

        GET(publicController, "", "changeLog"),

        // Endpoint: https://{{base_url}}/api/medication/syncDeviceMedicationData
        // Description: Syncs medication data from the device to the server.
        // Required:
        //   - Body: (array) - An array of medication data to be synchronized.
        //   - Bearer Token: An authorization token is required in the header for authentication.
        POST(medicationController,"medication", "syncDeviceMedicationData"),

        // Endpoint: https://{{base_url}}/api/medication/getUpdatedMedicationEntries
        // Description: Retrieves updated medication entries for a specific user based on a provided timestamp.
        // Required:
        //   - Parameters:
        //     - userId: (string) - The ID of the user for whom to retrieve medication entries.
        //     - Optional:
        //       - timeStamp: (integer) - The timestamp to filter entries. If not provided, the default is 0.
        //   - Bearer Token: An authorization token is required in the header for authentication.
        GET(medicationController, "medication", "getUpdatedMedicationEntries"),

        // Endpoint: https://{{base_url}}/api/recipes/searchRecipes
        // Description: Retrieves a list of recipes based on the search query. The results include public recipes and private recipes owned by the specified user.
        // Required:
        //   - Parameters:
        //     - userId: (string) - The ID of the user requesting the recipes. It is used to filter private recipes.
        //     - Optional:
        //       - searchQuery: (string) - The search term to filter recipes by name. Must be at least 3 characters long.
        //       - timeStamp: (integer) - The timestamp to filter entries. If not provided, the default is 0.
        //   - Bearer Token: An authorization token is required in the header for authentication.
        GET(recipesController, "recipes", "searchRecipes"),

        // Endpoint: https://{{base_url}}/api/recipes/createRecipe
        // Description: Creates a new recipe and stores it in the database.
        // Required:
        //   - Body: (object) - The recipe data to be stored, including name, description, ingredients, etc.
        //   - Bearer Token: An authorization token is required in the header for authentication.
        POST(recipesController, "recipes", "createRecipe"),

        GET(recipesController, "recipes", "overview"),

        GET(recipesController, "recipes", "generateRecipe"),

        GET(recipesController, "meal", "getUpdatedMealEntries"),

        // Endpoint: https://{{base_url}}/api/mealPlan/syncDeviceMealPlanDayData
        // Description: Syncs meal plan data from the device to the server.
        // Required:
        //   - Body: (array) - An array of meal plan day data to be synchronized.
        //   - Bearer Token: An authorization token is required in the header for authentication.
        POST(mealPlanController,"mealPlan", "syncDeviceMealPlanDayData"),
        // Endpoint: https://{{base_url}}/api/mealPlan/getUpdatedMealPlanDayEntries
        // Description: Retrieves updated meal plan day entries for a specific user based on a provided timestamp.
        // Required:
        //   - Parameters:
        //     - userId: (string) - The ID of the user for whom to retrieve meal plan day entries.
        //     - Optional:
        //       - timeStamp: (integer) - The timestamp to filter entries. If not provided, the default is 0.
        //   - Bearer Token: An authorization token is required in the header for authentication.
        GET(mealPlanController, "mealPlan", "getUpdatedMealPlanDayEntries"),

        POST(shoppingListController,"shoppingList", "syncDeviceShoppingListData"),
        GET(shoppingListController,"shoppingList", "getUpdatedShoppingListEntries"),
    ]
};

function GET(controller, slug = "", methode) {
  const path = slug === "" ? `/${methode}` : `/${slug}/${methode}`;
  return {
      method: "GET",
      path: path,
      handler: controller + methode,
      config: { policies: [] }
    };
}
function POST(controller, slug, methode) {
    const path = slug === "" ? `/${methode}` : `/${slug}/${methode}`;
    return {
        method: "POST",
        path: path,
        handler: controller + methode,
        config: { policies: [] }
    };
}
function PUT(controller, slug, methode) {
  const path = slug === "" ? `/${methode}` : `/${slug}/${methode}`;
  return {
    method: "PUT",
    path: path,
    handler: controller + methode,
    config: { policies: [] }
  };
}
function DEL(controller, slug, methode) {
  const path = slug === "" ? `/${methode}` : `/${slug}/${methode}`;
  return {
    method: "DELETE",
    path: path,
    handler: controller + methode,
    config: { policies: [] }
  };
}
