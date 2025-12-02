/**
 * Executions index
 * Re-exports all tool execution functions and their types
 */

export { getWeatherExecution, type WeatherInput, type WeatherResult } from "./getWeatherExecution";
export { getFlightsExecution, type FlightsInput, type FlightsResult } from "./getFlightsExecution";
export { getHotelsExecution, type HotelsInput, type HotelsResult } from "./getHotelsExecution";
export { getNewsExecution, type NewsInput, type NewsArticle, type NewsResult } from "./getNewsExecution";

