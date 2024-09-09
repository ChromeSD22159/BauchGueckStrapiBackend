# 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```


## API Routes
### General Endpoints
`GET /api/getCurrentTimeStamp`
- Retrieves the current, previous, and future timestamps for synchronization purposes.

`GET /api/getApiStatistics`
- Retrieves statistical data about various entities within the application.

`GET /api/generateID`
- Generate uniqueIDs

### Medication Endpoints
`POST /api/medication/syncDeviceMedicationData`
- Syncs medication data from the device to the server.

`GET /api/medication/getUpdatedMedicationEntries`
- Retrieves updated medication entries for a specific user based on a provided timestamp.

### Recipe Endpoints
`GET /api/recipes/searchRecipes`
- Retrieves a list of recipes based on the search query, including public and private recipes owned by the user.

`POST /api/recipes/createRecipe`
- Required to user /api/upload/ before an need the imageId for generating an Recipe!!!
- Creates a new recipe and stores it in the database. And Generate Nutrition by Google Gemini!!!

`POST /api/overview`
- Default is 0, 
- parameter: /api/overview?count=0

`POST {{base_url}}/api/getStartUpMeals`
- Required!  Bearer Token in the Authorization header.

`POST {{base_url}}/api/getStartUpMealsCount`
- Required!  Bearer Token in the Authorization header.
- RETURN Integer of Items
``` json
{
    "length": 3
}
```

### Meal Plan Endpoints
`POST /api/mealPlan/syncDeviceMealPlanDayData` 
- Syncs meal plan data from the device to the server.


`GET /api/mealPlan/getUpdatedMealPlanDayEntries`
- Retrieves updated meal plan day entries for a specific user based on a provided timestamp.




## ⚙️ Instructions for using the Postman Collection

This Postman Collection contains API requests for interacting with the BauchGlück backend. Before you can execute the requests, you must configure the required environment variables.


#### Environment variables
1. `base_url`
- Provide the base URL of your Strapi backend.
- Example: http://localhost:1337 (for local development) or https://api.frederikkohler.de/bauchglueck (for production).


2. `userId`
- Setzen Sie dies auf die eindeutige ID des Benutzers, für den Sie Anfragen durchführen möchten.

#### Environment variable setup
1. Click the eye icon in the top right corner of Postman to open the Environments pane.
2. Click “Create New Environment.”
3. Enter a name for your environment (e.g. "Development" or "Production").
4. Add the following variables:
    - Variable: base_url
    - Initial Value: http://localhost:1337 (or your equivalent base URL)
    - Variable: userId
    - Initial Value: your_user_id
5. Save the environment.
6. Select the newly created environment from the drop-down menu in the Environments section.

#### Execute the requests
- Select the desired request from the collection.
- Check that the request uses the correct environment variables (e.g. {{base_url}}/api/endpoint).
- Click "Send" to complete the request.
- Review the response at the bottom to ensure the request was successful and the expected data was returned.


## Recipes
[Recipes for gastric bypass operated people.](https://www.lecker-ohne.de/)

