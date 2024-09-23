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
                type: SchemaType.OBJECT,
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

async function generateRecipe(category, generateNutrition) {
    // Prüfen, ob die übergebene Kategorie gültig ist
    const validCategory = validCategories.find(cat => cat.name.toLowerCase() === category.toLowerCase());

    // Falls keine gültige Kategorie gefunden wurde, setze eine Standardkategorie
    if (!validCategory) {
      console.warn(`Ungültige Kategorie: ${category}. Standardkategorie 'hauptgericht' wird verwendet.`);
      category = "hauptgericht";
    }

    const cat = category ? category : "Hauptgericht";

    const withNutrition = generateNutrition ? generateNutrition : false;

    const prompt = `
        Du bist ein Ernährungsberater, der sich auf Patienten mit Magenbypass, Magenband und Schlauchmagen spezialisiert hat.
        Erstelle ein Rezept, das in die Kategorie ${cat} fällt und fettarme sowie eiweißreiche Lebensmittel bevorzugt, während zuckerhaltige Lebensmittel minimiert werden.
        Die Portion sollte pro Mahlzeit etwa 100 g betragen. Berechne die gesamten Nährwerte für die Mahlzeit, einschließlich Kalorien, Proteine, Fett und Kohlenhydrate.
        Achte darauf, dass die Mahlzeit leicht verdaulich und für Patienten nach bariatrischen Eingriffen geeignet ist.
    `;

    const responseSchema = {
        type: SchemaType.OBJECT,
        properties: {
            name: { type: SchemaType.STRING },
            description: { type: SchemaType.STRING },
            preparation: { type: SchemaType.STRING },
            preparationTimeInMinutes: { type: SchemaType.STRING },
            isSnack: { type: SchemaType.BOOLEAN },
            isPrivate: { type: SchemaType.BOOLEAN },
            isDeleted: { type: SchemaType.BOOLEAN },
            ingredients: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    __component: {
                      type: SchemaType.STRING,
                      enum: ["recipe.single-ingredient"] // Fester Wert
                    },
                    name: { type: SchemaType.STRING },
                    unit: { type: SchemaType.STRING },
                    value: { type: SchemaType.STRING }
                  }
                }
            },
            category: {
              type: SchemaType.OBJECT,
              properties: {
                categoryId: {
                  type: SchemaType.STRING,
                  enum: validCategories.map(cat => cat.categoryId)
                },
                name: { type: SchemaType.STRING }
              }
            }
        },
    };

    if (withNutrition) {
        responseSchema.properties.protein = { type: SchemaType.NUMBER };
        responseSchema.properties.fat = { type: SchemaType.NUMBER };
        responseSchema.properties.sugar = { type: SchemaType.NUMBER };
        responseSchema.properties.kcal = { type: SchemaType.NUMBER };
    }

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro-latest",
        generationConfig: {
            response_mime_type: "application/json",
            responseSchema: responseSchema,
        },
    })

    try {
        let result = await model.generateContent(prompt);

        return result.response.text()
    } catch (error) {
        console.error("Fehler bei der Rezept erstellung:", error);
        return null;
    }
}

const validCategories = [
    { categoryId: "snack", name: "Snack" },
    { categoryId: "hauptgericht", name: "Hauptgericht" },
    { categoryId: "beilage", name: "Beilage" },
    { categoryId: "dessert", name: "Dessert" },
    { categoryId: "frueh-phase", name: "Früh-Phase" }, // Phase nach der OP (flüssig)
    { categoryId: "puerierte-phase", name: "Pürierte Phase" }, // Phase mit pürierter Nahrung
    { categoryId: "weiche-kost", name: "Weiche Kost" }, // Weiche, leicht verdauliche Nahrung
    { categoryId: "normale-kost", name: "Normale Kost" }, // Nach der Anpassungsphase
    { categoryId: "proteinreich", name: "Proteinreich" }, // Hoher Proteingehalt
    { categoryId: "low-fat", name: "Low Fat" }, // Niedriger Fettgehalt
    { categoryId: "low-carb", name: "Low Carb" } // Niedriger Kohlenhydratgehalt
];

module.exports = {
    calculateNutritionForRecipe,
    generateRecipe
};

