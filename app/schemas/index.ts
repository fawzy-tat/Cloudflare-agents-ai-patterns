import { z } from "zod";

// ============================================================================
// Zod Schemas for streaming responses (shared between frontend and backend)
// ============================================================================

// Recipe Schema
export const recipeSchema = z.object({
    recipe: z.object({
        name: z.string().describe("The name of the recipe"),
        cuisine: z.string().describe("The type of cuisine"),
        prepTime: z.string().describe("Preparation time"),
        cookTime: z.string().describe("Cooking time"),
        servings: z.number().describe("Number of servings"),
        ingredients: z
            .array(
                z.object({
                    item: z.string(),
                    amount: z.string(),
                    unit: z.string().optional(),
                })
            )
            .describe("List of ingredients with amounts"),
        steps: z.array(z.string()).describe("Step-by-step cooking instructions"),
        tips: z.array(z.string()).optional().describe("Optional cooking tips"),
    }),
});

// Hero Schema (for array streaming)
export const heroSchema = z.object({
    name: z.string().describe("The hero's name"),
    class: z.string().describe("Character class (e.g., warrior, mage, rogue, healer)"),
    level: z.number().describe("Character level between 1-100"),
    race: z.string().describe("Character race/species"),
    backstory: z.string().describe("A brief 2-3 sentence backstory"),
    skills: z.array(z.string()).describe("3-4 notable skills or abilities"),
    stats: z
        .object({
            strength: z.number().min(1).max(20),
            agility: z.number().min(1).max(20),
            intelligence: z.number().min(1).max(20),
            charisma: z.number().min(1).max(20),
        })
        .describe("Character stats from 1-20"),
});

// Heroes Array Schema (for array streaming)
export const heroesArraySchema = z.array(heroSchema);

// ============================================================================
// CLASSIFICATION SCHEMAS
// Used for content classification with enum-based outputs
// ============================================================================

// Sentiment Classification Schema
export const sentimentSchema = z.object({
    classification: z.enum([
        "very_positive",
        "positive",
        "neutral",
        "negative",
        "very_negative",
    ]),
    confidence: z.string().describe("Confidence level: high, medium, or low"),
});

// Genre Classification Schema
export const genreSchema = z.object({
    classification: z.enum([
        "action",
        "comedy",
        "drama",
        "horror",
        "sci-fi",
        "romance",
        "thriller",
        "documentary",
        "animation",
        "fantasy",
    ]),
    confidence: z.string().describe("Confidence level: high, medium, or low"),
});

// Priority Classification Schema
export const prioritySchema = z.object({
    classification: z.enum(["critical", "high", "medium", "low", "none"]),
    confidence: z.string().describe("Confidence level: high, medium, or low"),
});

// Generic Classification Schema (for backward compatibility)
export const classificationSchema = z.object({
    classification: z.string().describe("The classification result"),
    confidence: z.string().describe("Confidence level"),
});

// ============================================================================
// GENERATIVE UI SCHEMAS
// These schemas define the output types for Generative UI tool results
// ============================================================================

// Weather display schema (for displayWeather tool)
export const weatherOutputSchema = z.object({
    location: z.string(),
    condition: z.string(),
    temperature: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    unit: z.string(),
});

// Stock price schema (for getStockPrice tool)
export const stockOutputSchema = z.object({
    symbol: z.string(),
    companyName: z.string(),
    price: z.number(),
    change: z.number(),
    changeDirection: z.enum(["up", "down"]),
    volume: z.number(),
    marketCap: z.string(),
});

// Calendar event schema (for createEvent tool)
export const eventOutputSchema = z.object({
    id: z.string(),
    title: z.string(),
    date: z.string(),
    time: z.string(),
    duration: z.string(),
    description: z.string(),
    status: z.string(),
    createdAt: z.string(),
});

// ============================================================================
// Type inference from schemas
// ============================================================================

export type Recipe = z.infer<typeof recipeSchema>;
export type Hero = z.infer<typeof heroSchema>;
export type Classification = z.infer<typeof classificationSchema>;

// Classification types
export type SentimentClassification = z.infer<typeof sentimentSchema>;
export type GenreClassification = z.infer<typeof genreSchema>;
export type PriorityClassification = z.infer<typeof prioritySchema>;

// Generative UI types
export type WeatherOutput = z.infer<typeof weatherOutputSchema>;
export type StockOutput = z.infer<typeof stockOutputSchema>;
export type EventOutput = z.infer<typeof eventOutputSchema>;

