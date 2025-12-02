// ============================================================================
// Prompts for AI interactions
// Centralized prompt management for better maintainability
// ============================================================================

// ============================================================================
// STREAM OBJECT PROMPTS
// Used with Vercel AI SDK streamObject() for structured data generation
// ============================================================================

/**
 * Generate a prompt for recipe creation
 */
export const getRecipePrompt = (cuisine: string): string => {
    return `Generate a detailed ${cuisine} recipe. Be creative and include realistic cooking times and measurements.`;
};

/**
 * Generate a prompt for hero character generation
 */
export const getHeroesPrompt = (count: number, genre: string): string => {
    return `Generate ${count} unique ${genre} RPG hero characters. Each should have a distinct personality and playstyle. Make them diverse and interesting.`;
};

// ============================================================================
// CLASSIFICATION PROMPTS
// Used with streamObject() for content classification
// ============================================================================

/**
 * Generate a prompt for sentiment analysis
 */
export const getSentimentPrompt = (text: string): string => {
    return `Analyze the sentiment of the following text and classify it into one of these categories: very_positive, positive, neutral, negative, very_negative.

Text: "${text}"`;
};

/**
 * Generate a prompt for genre classification
 */
export const getGenrePrompt = (text: string): string => {
    return `Classify the genre of this movie/book/show description into one of these categories: action, comedy, drama, horror, sci-fi, romance, thriller, documentary, animation, fantasy.

Description: "${text}"`;
};

/**
 * Generate a prompt for priority classification
 */
export const getPriorityPrompt = (text: string): string => {
    return `Assess the priority level of this support ticket or task into one of these categories: critical, high, medium, low, none.

Content: "${text}"`;
};

/**
 * Classification prompt configuration
 * Maps classification types to their respective prompt generators
 */
export const classificationPrompts = {
    sentiment: getSentimentPrompt,
    genre: getGenrePrompt,
    priority: getPriorityPrompt,
} as const;

export type ClassificationType = keyof typeof classificationPrompts;

// ============================================================================
// GENERATIVE UI PROMPTS
// System prompts for LLM interactions with tool usage
// ============================================================================

/**
 * System prompt for the Generative UI chat endpoint
 * Guides the LLM on when and how to use available tools
 */
export const GENERATIVE_UI_SYSTEM_PROMPT = `You are a helpful assistant that can display weather information, stock prices, and create calendar events.

## Your Approach
- Understand the user's intent before selecting a tool
- Use the most appropriate tool for each request
- Combine multiple tools when queries span different domains
- Provide contextual insights alongside raw data

## Rules
- Always use the displayWeather tool when users ask about weather conditions for any city or location
- Always use the getStockPrice tool when users inquire about stock information for any ticker symbol
- Always use the createEvent tool when users want to schedule or create calendar events
- Never fabricate data—rely solely on tool outputs
- Acknowledge when a request falls outside available tool capabilities

## Researching Instructions
- For weather queries: Identify the specific location and time frame the user is interested in
- For stock queries: Confirm the correct ticker symbol before fetching data
- For calendar events: Gather all necessary details (title, date, time, description) before creating an event
- Ask clarifying questions if the user's request is ambiguous

## Writing Style
- Be concise yet informative
- Provide a brief natural language summary after using a tool
- Use friendly, professional tone
- Format responses for easy readability
- Highlight key data points when presenting information`;

