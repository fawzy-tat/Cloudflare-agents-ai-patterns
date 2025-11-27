import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { getAgentByName, routeAgentRequest } from "agents";

// AGENTS IMPORT
import { SupportAgent } from "./agents/SupportAgent";
import { ResearchAgent } from "./agents/ResearchAgent";


const app = new Hono<{ Bindings: Env }>();

// API ROUTES
// Add more routes here
// simple get route to return a hello world message
app.get("/api/hello", (c) => {
	return c.text("Hello World");
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
 *   complete("", { body: { prompt: "Plan a trip to Paris", userId: "user-123" } });
 */
app.post("/api/research", async (c) => {
	const { prompt, userId } = await c.req.json<{ prompt: string; userId?: string }>();

	// Get or create a ResearchAgent instance for this user
	const agentId = userId || "default";
	const agent = await getAgentByName<Env, ResearchAgent>(c.env.ResearchAgent, agentId);

	// Forward the request to the agent's onRequest handler with the prompt
	// Note that fetching agentRequest returns toTextStreamResponse so no need to call toTextStreamResponse() here
	const agentRequest = new Request(c.req.url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ prompt }),
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
	const { prompt, userId } = await c.req.json<{ prompt: string; userId?: string }>();

	// Get or create a ResearchAgent instance for this user
	const agentId = userId || "default";
	const agent = await getAgentByName<Env, ResearchAgent>(c.env.ResearchAgent, agentId);

	// Call the custom RPC method directly - returns Response (no fetch/request needed)
	return (agent as any).initiateAgent(prompt);
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
