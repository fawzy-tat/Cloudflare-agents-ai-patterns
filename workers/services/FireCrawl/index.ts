import Firecrawl, { type ScrapeOptions, type CrawlOptions, type MapOptions } from "@mendable/firecrawl-js";

/**
 * FirecrawlClass - A wrapper around the Firecrawl API
 * Provides methods for scraping, crawling, mapping, searching, and extracting data from websites
 * 
 * @see https://docs.firecrawl.dev/introduction
 */
export class FirecrawlService {
    private client: Firecrawl;

    /**
     * Initialize the Firecrawl service with environment variables
     * @param env - Environment object containing FIRECRAWL_API_KEY
     */
    constructor(env: Env) {
        const apiKey = env.FIRECRAWL_API_KEY;

        if (!apiKey) {
            throw new Error('FIRECRAWL_API_KEY is not defined in environment variables');
        }

        if (!apiKey.startsWith('fc-')) {
            throw new Error('Invalid Firecrawl API key. API key should start with "fc-"');
        }

        this.client = new Firecrawl({ apiKey });
    }

    /**
     * Scrape a single URL and get its content in LLM-ready format
     * @param url - The URL to scrape
     * @param options - Scrape options
     * @returns Scraped data including markdown, html, metadata, etc.
     * 
     * @example
     * ```ts
     * const result = await firecrawl.scrape('https://example.com', {
     *   formats: ['markdown', 'html'],
     *   onlyMainContent: true
     * });
     * ```
     */
    async scrape(url: string, options?: ScrapeOptions) {
        try {
            return await this.client.scrape(url, options);
        } catch (error) {
            console.error('Firecrawl scrape error:', error);
            throw error;
        }
    }

    /**
     * Crawl a website and get all accessible pages in LLM-ready format
     * @param url - The starting URL to crawl
     * @param options - Crawl options
     * @returns Crawled pages data
     * 
     * @example
     * ```ts
     * const result = await firecrawl.crawl('https://example.com', {
     *   limit: 10,
     *   scrapeOptions: {
     *     formats: ['markdown']
     *   }
     * });
     * ```
     */
    async crawl(url: string, options?: CrawlOptions) {
        try {
            return await this.client.crawl(url, options);
        } catch (error) {
            console.error('Firecrawl crawl error:', error);
            throw error;
        }
    }

    /**
     * Map a website and get all URLs - extremely fast
     * @param url - The website URL to map
     * @param options - Map options
     * @returns List of all URLs found on the website
     * 
     * @example
     * ```ts
     * const urls = await firecrawl.map('https://example.com', {
     *   search: 'pricing'
     * });
     * ```
     */
    async map(url: string, options?: MapOptions) {
        try {
            return await this.client.map(url, options);
        } catch (error) {
            console.error('Firecrawl map error:', error);
            throw error;
        }
    }

    /**
     * Search the web and get full content from results
     * @param query - The search query
     * @param options - Search options
     * @returns Search results with full page content
     * 
     * @example
     * ```ts
     * const results = await firecrawl.search('artificial intelligence news', {
     *   limit: 5,
     *   lang: 'en'
     * });
     * ```
     */
    async search(
        query: string,
        options?: {
            limit?: number;
            lang?: string;
            country?: string;
            scrapeOptions?: {
                formats?: ('markdown' | 'html' | 'screenshot' | 'links')[];
                onlyMainContent?: boolean;
            };
        }
    ) {
        try {
            return await this.client.search(query, options);
        } catch (error) {
            console.error('Firecrawl search error:', error);
            throw error;
        }
    }

    /**
     * Extract structured data from a page or website using AI
     * @param options - Extract options with URL and schema
     * @returns Extracted structured data
     * 
     * @example
     * ```ts
     * const data = await firecrawl.extract({
     *   urls: ['https://example.com/products'],
     *   schema: {
     *     type: 'object',
     *     properties: {
     *       products: {
     *         type: 'array',
     *         items: {
     *           type: 'object',
     *           properties: {
     *             name: { type: 'string' },
     *             price: { type: 'number' }
     *           }
     *         }
     *       }
     *     }
     *   }
     * });
     * ```
     */
    async extract(options: {
        urls: string[];
        schema?: Record<string, any>;
        systemPrompt?: string;
        prompt?: string;
    }) {
        try {
            return await this.client.extract(options);
        } catch (error) {
            console.error('Firecrawl extract error:', error);
            throw error;
        }
    }

    /**
     * Check crawl job status (for async crawl operations)
     * @param jobId - The job ID from an async crawl
     * @returns Job status and results if available
     */
    async getCrawlStatus(jobId: string) {
        try {
            return await this.client.getCrawlStatus(jobId);
        } catch (error) {
            console.error('Firecrawl get crawl status error:', error);
            throw error;
        }
    }

    /**
     * Cancel a running crawl job
     * @param jobId - The job ID to cancel
     * @returns Cancellation confirmation
     */
    async cancelCrawl(jobId: string) {
        try {
            return await this.client.cancelCrawl(jobId);
        } catch (error) {
            console.error('Firecrawl cancel crawl error:', error);
            throw error;
        }
    }
}

/**
 * Helper function to create a Firecrawl service instance
 * @param env - Environment object containing FIRECRAWL_API_KEY
 * @returns Initialized FirecrawlService instance
 */
export function createFirecrawlService(env: Env): FirecrawlService {
    return new FirecrawlService(env);
}


// Example usage:

// import { FirecrawlService } from './workers/services/FireCrawl';

// // In your worker/agent - pass the entire env object
// export class MyAgent extends Agent<Env> {
//     async onRequest(request: Request) {
//         // Initialize with env
//         const firecrawl = new FirecrawlService(this.env);

//         // Or use the helper function
//         const firecrawl = createFirecrawlService(this.env);

//         // Use the service
//         const page = await firecrawl.scrape('https://example.com', {
//             formats: ['markdown']
//         });

//         return new Response(page.markdown);
//     }
// }