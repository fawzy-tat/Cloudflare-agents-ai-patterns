/**
 * Tool definitions for the AI chat agent
 * Tools can either require human confirmation or execute automatically
 */
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import {
    getWeatherExecution,
    getFlightsExecution,
    getHotelsExecution,
    getNewsExecution,
} from "../executions";

// ============================================================================
// GENERATIVE UI TOOLS
// These tools are designed for the Generative User Interfaces pattern
// where tool results are rendered as React components in the UI
// ============================================================================

/**
 * Display weather information for a location
 * Used in Generative UI to render a weather card component
 */
export const displayWeatherTool = tool({
    description: "Display the current weather for a location. Use this when the user asks about weather conditions.",
    inputSchema: z.object({
        location: z.string().describe("The city or location to get weather for"),
    }),
    execute: async ({ location }) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Simulated weather data
        const conditions = ["Sunny", "Cloudy", "Rainy", "Partly Cloudy", "Windy"];
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        const temperature = Math.floor(Math.random() * 30) + 10; // 10-40°C
        const humidity = Math.floor(Math.random() * 50) + 30; // 30-80%
        const windSpeed = Math.floor(Math.random() * 30) + 5; // 5-35 km/h

        return {
            location,
            condition,
            temperature,
            humidity,
            windSpeed,
            unit: "celsius",
        };
    },
});

/**
 * Get stock price information for a symbol
 * Used in Generative UI to render a stock card component
 */
export const getStockPriceTool = tool({
    description: "Get the current stock price for a company. Use this when the user asks about stock prices or market data.",
    inputSchema: z.object({
        symbol: z.string().describe("The stock ticker symbol (e.g., AAPL, GOOGL, MSFT)"),
        companyName: z.string().optional().describe("The company name"),
    }),
    execute: async ({ symbol, companyName }) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        // Simulated stock data
        const price = Math.floor(Math.random() * 500) + 50; // $50-$550
        const change = (Math.random() * 10 - 5).toFixed(2); // -5% to +5%
        const changePercent = parseFloat(change);

        return {
            symbol: symbol.toUpperCase(),
            companyName: companyName || symbol.toUpperCase(),
            price,
            change: changePercent,
            changeDirection: changePercent >= 0 ? "up" : "down",
            volume: Math.floor(Math.random() * 10000000) + 1000000,
            marketCap: `${Math.floor(Math.random() * 900) + 100}B`,
        };
    },
});

/**
 * Create a calendar event
 * Used in Generative UI to render an event confirmation card
 */
export const createEventTool = tool({
    description: "Create a calendar event. Use this when the user wants to schedule something.",
    inputSchema: z.object({
        title: z.string().describe("The event title"),
        date: z.string().describe("The event date (e.g., 'Tomorrow', 'Next Monday', '2024-12-15')"),
        time: z.string().describe("The event time (e.g., '2:00 PM', '14:00')"),
        duration: z.string().optional().describe("Event duration (e.g., '1 hour', '30 minutes')"),
        description: z.string().optional().describe("Event description"),
    }),
    execute: async ({ title, date, time, duration, description }) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            id: `evt_${Date.now()}`,
            title,
            date,
            time,
            duration: duration || "1 hour",
            description: description || "",
            status: "confirmed",
            createdAt: new Date().toISOString(),
        };
    },
});

/**
 * Get all Generative UI tools
 * @returns ToolSet for Generative UI endpoints
 */
export function generativeUITools(): ToolSet {
    return {
        displayWeather: displayWeatherTool,
        getStockPrice: getStockPriceTool,
        createEvent: createEventTool,
    };
}

// Travel Planning Tools
/**
 * Get weather for a destination
 * @param destination - The destination to get the weather for
 * @returns The weather for the destination
 */
export const getWeatherTool = tool({
    description: "Get weather for a destination",
    inputSchema: z.object({
        destination: z.string().describe("The destination to get weather for (e.g., 'Paris', 'Tokyo', 'New York')"),
    }),
    execute: getWeatherExecution,
});

/**
 * Search flights to a destination
 * @param destination - The destination to search flights for
 * @returns The flights to the destination
 */
export const getFlightsTool = tool({
    description: "Search flights to a destination",
    inputSchema: z.object({
        destination: z.string().describe("The destination to search flights for (e.g., 'Paris', 'Tokyo', 'New York')"),
    }),
    execute: getFlightsExecution,
});

/**
 * Search hotels in a destination
 * @param destination - The destination to search hotels for
 * @returns The hotels in the destination
 */
export const getHotelsTool = tool({
    description: "Search hotels in a destination",
    inputSchema: z.object({
        destination: z.string().describe("The destination to search hotels for (e.g., 'Paris', 'Tokyo', 'New York')"),
    }),
    execute: getHotelsExecution,
});

/**
 * Get CNN news articles for a destination
 * Uses Firecrawl's scrape method with JSON format for structured extraction
 * Combined with wait actions to handle JavaScript-rendered content
 * 
 * @see https://docs.firecrawl.dev/api-reference/endpoint/scrape
 * @param env - Environment object containing API keys
 * @returns Tool for scraping CNN news articles
 */
export function getNewsTool(env: Env) {
    return tool({
        description: "Get the latest news articles about a specific destination from CNN. Returns article titles, descriptions, dates, and URLs.",
        inputSchema: z.object({
            destination: z.string().describe("The destination to search news articles for (e.g., 'Egypt', 'France', 'Japan')"),
        }),
        execute: ({ destination }) => getNewsExecution({ destination }, env),
    });
}

/**
 * Get all tools a complete toolset with all available tools
 * @param env - Environment object (required for tools that need API access)
 * @returns Complete toolset
 */
export function allTools(env: Env): ToolSet {
    return {
        getWeatherTool,
        getFlightsTool,
        getHotelsTool,
        getNewsTool: getNewsTool(env),
    };
}

// Default export for backward compatibility 
export const tools = {
    getWeatherTool,
    getFlightsTool,
    getHotelsTool,
    getNewsTool: getNewsTool,
};
