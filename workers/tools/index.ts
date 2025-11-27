/**
 * Tool definitions for the AI chat agent
 * Tools can either require human confirmation or execute automatically
 */
import { tool, type ToolSet } from "ai";
import { z } from "zod";

// Travel Planning Tools
/**
 * Get weather for a city
 * @param city - The city to get the weather for
 * @returns The weather for the city
 */
export const getWeatherTool = tool({
    description: "Get weather for a city",
    inputSchema: z.object({
        city: z.string(),
    }),
    async execute({ city }) {
        console.log(`Fetching weather for ${city}...`);
        await new Promise((r) => setTimeout(r, 1000));
        return { city, temp: 72, conditions: "sunny" };
    },
});

/**
 * Search flights to a city
 * @param destination - The destination city to search flights for
 * @returns The flights to the destination city
 */
export const getFlightsTool = tool({
    description: "Search flights to a city",
    inputSchema: z.object({
        destination: z.string(),
    }),
    async execute({ destination }) {
        console.log(`Searching flights to ${destination}...`);
        await new Promise((r) => setTimeout(r, 1500));
        return { destination, price: 350, airline: "CloudAir" };
    },
});

/**
 * Search hotels in a city
 * @param city - The city to search hotels for
 * @returns The hotels in the city
 */
export const getHotelsTool = tool({
    description: "Search hotels in a city",
    inputSchema: z.object({
        city: z.string(),
    }),
    async execute({ city }) {
        console.log(`Finding hotels in ${city}...`);
        await new Promise((r) => setTimeout(r, 1200));
        return { city, avgPrice: 120, topPick: "Grand Hotel" };
    },
});

export const tools = {
    getWeatherTool,
    getFlightsTool,
    getHotelsTool,
} satisfies ToolSet;