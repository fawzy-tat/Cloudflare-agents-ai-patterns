/**
 * News execution logic
 * Fetches CNN news articles for a destination using Firecrawl
 * 
 * @see https://docs.firecrawl.dev/api-reference/endpoint/scrape
 */

import { FirecrawlService } from "../services/FireCrawl";

export interface NewsInput {
    destination: string;
}

export interface NewsArticle {
    title: string;
    description?: string;
    date?: string;
    url: string;
}

export interface NewsResult {
    destination: string;
    totalArticles?: number;
    articles: NewsArticle[];
    searchUrl?: string;
    message?: string;
    error?: string;
}

/**
 * Get CNN news articles for a destination
 * Uses Firecrawl's scrape method with JSON format for structured extraction
 * Combined with wait actions to handle JavaScript-rendered content
 * 
 * @param input - The input containing the destination name
 * @param env - Environment object containing API keys
 * @returns The news articles for the destination
 */
export async function getNewsExecution({ destination }: NewsInput, env: Env): Promise<NewsResult> {
    try {
        console.log(`Fetching CNN news for ${destination}...`);

        // Initialize Firecrawl service
        const firecrawl = new FirecrawlService(env);

        // Construct CNN search URL
        const searchUrl = `https://www.cnn.com/search?q=${encodeURIComponent(destination)}&from=0&size=10&sort=newest`;

        console.log(`Scraping URL: ${searchUrl}`);

        // Define the JSON schema for structured extraction
        const articleSchema = {
            type: "object",
            properties: {
                articles: {
                    type: "array",
                    description: "List of news articles found on the page",
                    items: {
                        type: "object",
                        properties: {
                            title: {
                                type: "string",
                                description: "The headline/title of the news article"
                            },
                            description: {
                                type: "string",
                                description: "A brief summary or description of the article"
                            },
                            date: {
                                type: "string",
                                description: "The publication date or time ago (e.g., '2 hours ago', 'Nov 29, 2024')"
                            },
                            url: {
                                type: "string",
                                description: "The full URL link to the article"
                            }
                        },
                        required: ["title", "url"]
                    }
                }
            },
            required: ["articles"]
        };

        // Use Firecrawl's scrape method with JSON format for structured extraction
        // This combines waiting for JS content + AI-powered extraction in one call
        const result = await firecrawl.scrape(searchUrl, {
            formats: [
                {
                    type: 'json',
                    schema: articleSchema,
                    prompt: `Extract all news article search results from this CNN search page. 
                             For each article, extract the title, description/summary, publication date, and full URL.
                             Only include actual news articles, not navigation links or ads.
                             Return up to 10 most recent articles.`
                } as any
            ],
            waitFor: 2000, // Wait 5 seconds for JS to render
            actions: [
                { type: 'wait', milliseconds: 3000 }, // Additional wait for dynamic content
                { type: 'scroll', direction: 'down' } as any, // Scroll to trigger lazy loading
                { type: 'wait', milliseconds: 2000 }, // Wait after scroll
            ],
            timeout: 60000, // 60 second timeout for extraction
        });

        console.log('Firecrawl scrape completed');

        // Access the JSON extracted data
        const jsonData = (result as any).json as {
            articles?: NewsArticle[];
        };

        console.log('Extracted JSON data:', JSON.stringify(jsonData, null, 2));

        if (!jsonData || !jsonData.articles || jsonData.articles.length === 0) {
            console.log('No articles extracted from JSON');
            return {
                destination,
                message: `No news articles found for ${destination} on CNN`,
                articles: []
            };
        }

        console.log(`Found ${jsonData.articles.length} articles for ${destination}`);

        return {
            destination,
            totalArticles: jsonData.articles.length,
            articles: jsonData.articles.slice(0, 10), // Limit to 10 articles
            searchUrl
        };

    } catch (error) {
        console.error('CNN news scraping error:', error);
        return {
            destination,
            error: error instanceof Error ? error.message : "Unknown error occurred",
            articles: []
        };
    }
}
