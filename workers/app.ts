import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { getAgentByName, routeAgentRequest } from "agents";
import { streamObject, streamText, convertToModelMessages, stepCountIs } from "ai";
import type { UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";

// AGENTS IMPORT
import { SupportAgent } from "./agents/SupportAgent";
import { ResearchAgent } from "./agents/ResearchAgent";

// TOOLS IMPORT
import { generativeUITools } from "./tools";

// SCHEMAS IMPORT
import {
	recipeSchema,
	heroSchema,
	sentimentSchema,
	genreSchema,
	prioritySchema,
} from "../app/schemas";

// PROMPTS IMPORT
import {
	getRecipePrompt,
	getHeroesPrompt,
	classificationPrompts,
	GENERATIVE_UI_SYSTEM_PROMPT,
	type ClassificationType,
} from "../app/prompts";


const app = new Hono<{ Bindings: Env }>();

// API ROUTES
app.get("/api/health", (c) => {
	return c.json({ status: "ok" });
});

// ============================================================================
// VERCEL AI SDK: streamObject() Demo Endpoints
// 
// These endpoints demonstrate the streamObject() feature from Vercel AI SDK.
// Unlike agent-based endpoints, these call the LLM directly without routing
// through a Cloudflare Agent/Durable Object.
// ============================================================================

/**
 * Endpoint: Stream Object - Recipe Generation
 * 
 * Demonstrates streaming a structured object using a Zod schema.
 * The response streams partial objects as they're generated, allowing
 * the UI to show progressive updates (e.g., name appears first, then
 * ingredients stream in one by one, then steps).
 * 
 * Use case: Structured data generation where you want to display
 * partial results as they become available.
 */
app.post("/api/stream-object/recipe", async (c) => {
	const { cuisine } = await c.req.json<{ cuisine?: string }>();
	const selectedCuisine = cuisine || "Italian";

	const result = streamObject({
		model: openai("gpt-4o-mini"),
		schema: recipeSchema,
		prompt: getRecipePrompt(selectedCuisine),
	});

	// Return the streaming response
	// The client receives partial objects as they're generated
	return result.toTextStreamResponse();
});

/**
 * Endpoint: Stream Array - Hero Character Generation
 * 
 * Demonstrates streaming an array of objects using output: 'array'.
 * Each complete hero object is streamed as it's generated, perfect
 * for displaying items in a list as they become available.
 * 
 * Use case: Generating lists where each item should appear as soon
 * as it's complete (e.g., search results, suggestions, game characters).
 */
app.post("/api/stream-object/heroes", async (c) => {
	const { count, genre } = await c.req.json<{ count?: number; genre?: string }>();
	const heroCount = Math.min(count || 4, 6); // Cap at 6 for demo
	const selectedGenre = genre || "fantasy";

	const result = streamObject({
		model: openai("gpt-4o-mini"),
		output: "array",
		schema: heroSchema,
		prompt: getHeroesPrompt(heroCount, selectedGenre),
	});

	return result.toTextStreamResponse();
});

/**
 * Endpoint: Stream Enum - Content Classification
 * 
 * Demonstrates streaming an enum value using output: 'enum'.
 * The model chooses from a predefined list of values, perfect
 * for classification, categorization, or decision-making tasks.
 * 
 * Use case: Sentiment analysis, content moderation, routing decisions,
 * category assignment, or any scenario with fixed output choices.
 * 
 * NOTE: Using schema-based approach with z.enum() for better compatibility.
 */
app.post("/api/stream-object/classify", async (c) => {
	console.log("[classify] Received classification request");

	const { text, classificationType } = await c.req.json<{
		text: string;
		classificationType?: ClassificationType;
	}>();

	console.log("[classify] Text:", text);
	console.log("[classify] Classification type:", classificationType);

	if (!text) {
		console.log("[classify] Error: No text provided");
		return c.json({ error: "Text is required for classification" }, 400);
	}

	// Map classification types to their schemas
	const schemaMap = {
		sentiment: sentimentSchema,
		genre: genreSchema,
		priority: prioritySchema,
	};

	const type: ClassificationType = classificationType || "sentiment";
	const schema = schemaMap[type];
	const prompt = classificationPrompts[type](text);

	console.log("[classify] Using classification type:", type);

	try {
		const result = streamObject({
			model: openai("gpt-4o-mini"),
			schema,
			prompt,
		});

		console.log("[classify] streamObject created, returning response");
		return result.toTextStreamResponse();
	} catch (error) {
		console.error("[classify] Error creating streamObject:", error);
		return c.json({ error: "Failed to classify" }, 500);
	}
});

// ============================================================================
// VERCEL AI SDK: Generative User Interfaces Demo Endpoint
// 
// This endpoint demonstrates the Generative UI pattern from Vercel AI SDK.
// Unlike streamObject(), Generative UI uses tools that the LLM decides to call,
// and the results are rendered as React components in the UI.
// 
// Key differences from streamObject():
// - LLM decides WHEN to use tools (vs always generating structured data)
// - Results are rendered as UI components based on tool calls
// - Supports multi-turn conversations with useChat hook
// - Uses toUIMessageStreamResponse() instead of toTextStreamResponse()
// ============================================================================

/**
 * Endpoint: Generative UI Chat
 * 
 * Demonstrates the Generative User Interfaces pattern where:
 * 1. User sends a message via useChat hook
 * 2. LLM processes the message and may call tools (weather, stock, events)
 * 3. Tool results are streamed back as tool-invocation parts
 * 4. Frontend renders appropriate UI components for each tool result
 * 
 * Use case: Interactive chat where AI can display rich UI elements
 * like weather cards, stock tickers, or event confirmations.
 */
app.post("/api/generative-ui/chat", async (c) => {
	try {
		// AI SDK 5.x: useChat sends { messages } as UIMessage[]
		const { messages } = await c.req.json<{ messages: UIMessage[] }>();

		const result = streamText({
			model: openai("gpt-4o-mini"),
			system: GENERATIVE_UI_SYSTEM_PROMPT,
			// Convert UIMessage[] to model messages format
			messages: convertToModelMessages(messages),
			tools: generativeUITools(),
			// AI SDK 5.x: Use stopWhen with stepCountIs instead of maxSteps
			stopWhen: stepCountIs(5),
		});

		// AI SDK 5.x: Use toUIMessageStreamResponse for useChat hook compatibility
		return result.toUIMessageStreamResponse();
	} catch (error) {
		console.error("[generative-ui] Error:", error);
		return c.json({ error: "Failed to process chat request" }, 500);
	}
});

/**
 * Endpoint 1: Direct Agent Routing for useAgent hook (WebSocket-based)
 * 
 * Use this with Cloudflare's useAgent React hook for real-time WebSocket connections.
 * The frontend connects via: useAgent({ agent: "research-agent", name: "<user-id>" })
 * 
 * routeAgentRequest automatically routes to /agents/:agent/:name pattern and handles WebSocket upgrades.
 * NOTE: Must be defined BEFORE the React Router catch-all route.
 */
app.all("/agents/*", async (c) => {
	return (
		(await routeAgentRequest(c.req.raw, c.env)) ||
		c.json({ error: "Agent not found" }, 404)
	);
});

/**
 * Endpoint 2: HTTP Streaming for Vercel AI SDK hooks (useChat/useCompletion)
 * 
 * Use this with Vercel's useChat or useCompletion hooks for HTTP-based streaming.
 * The frontend calls this endpoint and receives a streaming text response.
 * 
 * Example frontend usage:
 *   const { completion, complete } = useCompletion({ api: "/api/research" });
 *   complete("", { body: { city: "Tokyo, Japan", userId: "user-123" } });
 */
app.post("/api/research", async (c) => {
	const { city, userId } = await c.req.json<{ city: string; userId?: string }>();

	// Build user prompt from city selection
	const userPrompt = `Plan a trip to ${city}`;

	// Get or create a ResearchAgent instance for this user
	const agentId = userId || "default";
	const agent = await getAgentByName<Env, ResearchAgent>(c.env.ResearchAgent, agentId);

	// Forward the request to the agent's onRequest handler
	const agentRequest = new Request(c.req.url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ prompt: userPrompt }),
	});

	return agent.fetch(agentRequest);
});

/**
 * Endpoint 3: Direct Agent RPC Method Invocation (Demo)
 * 
 * Demonstrates calling a custom RPC method (initiateAgent) on the agent directly,
 * instead of using the built-in onRequest handler via agent.fetch().
 * 
 * Key difference:
 * - /api/research: Uses agent.fetch(request) → triggers onRequest() handler
 * - /api/research/initiate: Calls agent.initiateAgent() directly → custom RPC method
 * 
 * This pattern is useful when you want named methods on your agent that can be
 * called directly from your API routes without constructing a Request object.
 */
app.post("/api/research/initiate", async (c) => {
	const { city, userId } = await c.req.json<{ city: string; userId?: string }>();

	// Build user prompt from city selection
	const userPrompt = `Plan a trip to ${city}`;

	// Get or create a ResearchAgent instance for this user
	const agentId = userId || "default";
	const agent = await getAgentByName<Env, ResearchAgent>(c.env.ResearchAgent, agentId);

	// Call the custom RPC method directly - returns Response (no fetch/request needed)
	return (agent as any).initiateAgent(userPrompt);
});


// AGENTS
export { SupportAgent, ResearchAgent };
// WORKER HANDLER
app.get("*", (c) => {
	const requestHandler = createRequestHandler(
		() => import("virtual:react-router/server-build"),
		import.meta.env.MODE,
	);

	return requestHandler(c.req.raw, {
		cloudflare: { env: c.env, ctx: c.executionCtx },
	});
});

export default app;
