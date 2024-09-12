const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

const apiKey = process.env.GOOGLE_AI_API;

const genAI = new GoogleGenerativeAI(apiKey);

function generateModel(responseSchema) {
    return genAI.getGenerativeModel({
        model: "gemini-1.5-pro-latest",
        generationConfig: {
            response_mime_type: "application/json",
            responseSchema: responseSchema,
        },
    })
}

async function calculateNutritionForRecipe(recipe) {
    const ingredients = recipe.ingredients;

    const ingredientList = ingredients.map(ingredient => `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`).join(', ');

    const responseSchema = {
        type: SchemaType.OBJECT,
        properties: {
            nutrition:  {
                properties: {
                    calories:  { type: SchemaType.NUMBER },
                    protein: { type: SchemaType.NUMBER },
                    fat: { type: SchemaType.NUMBER },
                    carbohydrates: { type: SchemaType.NUMBER },
                },
            }
        },
    };

    const prompt = `Du bist ein Ernährungsberatung für Magenbypass, Magenband und Schlauchmagen. Berechne die Nährwerte (Kalorien, Protein, Fett, Kohlenhydrate) für folgende Zutaten: ${ingredientList}. Nährwerte in Gramm pro 100g.`;

    const model = generateModel(responseSchema);

    try {
        let result = await model.generateContent(prompt);
        const parsedResult = JSON.parse(result.response.text());
        return parsedResult.nutrition;
    } catch (error) {
        console.error("Fehler bei der Nährwertberechnung:", error);
        return null;
    }
}

async function generateRecipe() {
    const prompt = `
      Du bist ein Ernährungsberater, der sich auf Patienten mit Magenbypass, Magenband und Schlauchmagen spezialisiert hat.
      Erstelle eine Rezeptvorlage, die fettarme und eiweißreiche Lebensmittel bevorzugt, während zuckerhaltige Lebensmittel minimiert werden.
      Jede Mahlzeit sollte etwa 100 g betragen. Berechne gesamt die Nährwerte für die Mahlzeit, einschließlich Kalorien, Proteine, Fett und Kohlenhydrate.
    `;

    const responseSchema = {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        description: { type: SchemaType.STRING },
        preparation: { type: SchemaType.STRING },
        preparationTimeInMinutes: { type: SchemaType.STRING },
        protein: { type: SchemaType.NUMBER },
        fat: { type: SchemaType.NUMBER },
        sugar: { type: SchemaType.NUMBER },
        kcal: { type: SchemaType.NUMBER },
        isSnack: { type: SchemaType.BOOLEAN },
        isPrivate: { type: SchemaType.BOOLEAN },
        isDeleted: { type: SchemaType.BOOLEAN },
        ingredients: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                unit: { type: SchemaType.STRING },
                value: { type: SchemaType.STRING }
              }
            }
        }
      },
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro-latest",
      generationConfig: {
        response_mime_type: "application/json",
        responseSchema: responseSchema,
      },
    })

    try {
        let result = await model.generateContent(prompt);

        console.log(result)

        return result.response.text()
    } catch (error) {
        console.error("Fehler bei der Rezept erstellung:", error);
        return null;
    }
}

module.exports = {
  calculateNutritionForRecipe,
  generateRecipe
};
