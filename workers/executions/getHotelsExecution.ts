/**
 * Hotels execution logic
 * Searches for hotels in a given destination
 */

export interface HotelsInput {
    destination: string;
}

export interface HotelsResult {
    destination: string;
    avgPrice: number;
    topPick: string;
}

/**
 * Search hotels in a destination
 * @param input - The input containing the destination name
 * @returns The hotel data for the destination
 */
export async function getHotelsExecution({ destination }: HotelsInput): Promise<HotelsResult> {
    console.log(`Finding hotels in ${destination}...`);
    await new Promise((r) => setTimeout(r, 1200));
    return { destination, avgPrice: 120, topPick: "Grand Hotel" };
}
