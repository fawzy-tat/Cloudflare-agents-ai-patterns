/**
 * Weather execution logic
 * Fetches real weather data from Open-Meteo API
 * @see https://open-meteo.com/en/docs
 */

import { cities } from "~/constants/cities";

type City = typeof cities[number];

/**
 * Find a city by name (case-insensitive, partial match)
 * Searches both city name and "City, Country" format
 */
function findCity(destination: string): City | undefined {
    const searchTerm = destination.toLowerCase().trim();

    // Try exact match on name first
    let city = cities.find(c => c.name.toLowerCase() === searchTerm);
    if (city) return city;

    // Try "City, Country" format
    city = cities.find(c =>
        `${c.name}, ${c.country}`.toLowerCase() === searchTerm
    );
    if (city) return city;

    // Try partial match on city name
    city = cities.find(c =>
        c.name.toLowerCase().includes(searchTerm) ||
        searchTerm.includes(c.name.toLowerCase())
    );
    if (city) return city;

    // Try matching country
    city = cities.find(c =>
        c.country.toLowerCase() === searchTerm ||
        searchTerm.includes(c.country.toLowerCase())
    );

    return city;
}

export interface WeatherInput {
    destination: string;
}

export interface CurrentWeather {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    is_day: number;
    time: string;
}

export interface WeatherResult {
    destination: string;
    country: string;
    latitude: number;
    longitude: number;
    temperature: number;
    temperatureUnit: string;
    windspeed: number;
    windspeedUnit: string;
    conditions: string;
    isDay: boolean;
    time: string;
}

/**
 * Map WMO weather codes to human-readable conditions
 * @see https://open-meteo.com/en/docs#weathervariables
 */
function getWeatherCondition(code: number): string {
    const conditions: Record<number, string> = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Foggy",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Light freezing drizzle",
        57: "Dense freezing drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Light freezing rain",
        67: "Heavy freezing rain",
        71: "Slight snow fall",
        73: "Moderate snow fall",
        75: "Heavy snow fall",
        77: "Snow grains",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Slight snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail",
    };
    return conditions[code] || "Unknown";
}

/**
 * Get weather for a destination using Open-Meteo API
 * @param input - The input containing the destination name
 * @returns Real weather data for the destination
 */
export async function getWeatherExecution({ destination }: WeatherInput): Promise<WeatherResult> {
    console.log(`Fetching weather for ${destination}...`);

    // Find city coordinates
    const city = findCity(destination);

    if (!city) {
        throw new Error(`City not found: ${destination}. Please use a supported city from our list.`);
    }

    // Call Open-Meteo API
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", city.lat.toString());
    url.searchParams.set("longitude", city.lon.toString());
    url.searchParams.set("current_weather", "true");

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
        current_weather: CurrentWeather;
        current_weather_units?: {
            temperature: string;
            windspeed: string;
        };
    };

    const current = data.current_weather;

    return {
        destination: city.name,
        country: city.country,
        latitude: city.lat,
        longitude: city.lon,
        temperature: current.temperature,
        temperatureUnit: data.current_weather_units?.temperature || "°C",
        windspeed: current.windspeed,
        windspeedUnit: data.current_weather_units?.windspeed || "km/h",
        conditions: getWeatherCondition(current.weathercode),
        isDay: current.is_day === 1,
        time: current.time,
    };
}
