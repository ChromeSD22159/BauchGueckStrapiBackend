const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = "AIzaSyCkMOAt4AV_-Ebu-WcJtZ6hEBKvp80e6aM";

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro-latest",
  generationConfig: { response_mime_type: "application/json" },
});

async function calculateNutritionForRecipe(recipe) {
    const ingredients = recipe.ingredients;

    const ingredientList = ingredients.map(ingredient => `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`).join(', ');

    const responseFormat = `{
        "nutrition": {
            "calories": "262.5",
            "protein": "2.6",
            "fat": "14.6",
            "carbohydrates": "32.7"
        }
    }`;

    const prompt = `Berechne die Nährwerte (Kalorien, Protein, Fett, Kohlenhydrate) für folgende Zutaten: ${ingredientList}. Gib das zusammengerechnete Gesamtergebnis als JSON-Objekt zurück. Nährwerte in Gramm. Gib die Antwort in diesem Format zurück: ${responseFormat}`;

    try {
        // Anfrage an das Model senden und auf das Ergebnis warten
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Versuche das Ergebnis als JSON zu parsen
        const parsedResult = JSON.parse(text);

        // Überprüfe ob das Ergebnis im richtigen Format ist
        if (parsedResult.nutrition) {
          return parsedResult.nutrition
        } else {
          console.error("Fehler: Unerwartetes Format der Antwort.", text);
        }
    } catch (error) {
        console.error("Fehler beim Verarbeiten des Prompts:", error);
        recipe.nutrition = { error: "Fehler beim Abrufen der Nährwerte" };
    }
}

module.exports = {
  calculateNutritionForRecipe
};
