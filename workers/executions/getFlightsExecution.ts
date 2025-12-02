/**
 * Flights execution logic
 * Searches for flights to a destination city
 */

export interface FlightsInput {
    destination: string;
}

export interface FlightsResult {
    destination: string;
    price: number;
    airline: string;
}

/**
 * Search flights to a city
 * @param input - The input containing the destination city
 * @returns The flight data for the destination
 */
export async function getFlightsExecution({ destination }: FlightsInput): Promise<FlightsResult> {
    console.log(`Searching flights to ${destination}...`);
    await new Promise((r) => setTimeout(r, 1500));
    return { destination, price: 350, airline: "CloudAir" };
}

