# Building AI Agents on Cloudflare: A Practical Guide

The first time I got a Vercel AI Agent to stream a response through a Cloudflare Durable Object, I sat there watching the text flow in, chunk by chunk, and thought: _this is exactly how AI agents should be built_.

I'd been experimenting with various agent frameworks for months. Most of them felt like you were fighting the infrastructure as much as building the actual agent. But when I discovered that Cloudflare's Agent SDK could serve as the stateful container while Vercel's AI SDK handled the cognitive layer—that clicked. Two tools, each excellent at their job, working together without getting in each other's way.

This project is the result of that exploration: a working reference implementation that demonstrates multiple patterns for building AI agents using this stack.

---

## What This Project Demonstrates

This isn't just a starter template. It's a collection of working examples that show you different ways to connect your frontend to AI agents, each with its own trade-offs. By the time you finish reading this, you'll understand:

- How to build stateful AI agents using Cloudflare Durable Objects
- How to integrate Vercel's AI SDK for LLM orchestration and tool use
- Four distinct patterns for frontend-to-agent communication
- When to use WebSockets vs HTTP streaming
- Common pitfalls and how to avoid them (so you don't have to debug the same issues I did)

---

## The Stack

| Layer                  | Technology               | Purpose                                              |
| ---------------------- | ------------------------ | ---------------------------------------------------- |
| **Runtime**            | Cloudflare Workers       | Edge compute, global distribution                    |
| **State**              | Durable Objects          | Per-user agent instances, persistence, SQLite        |
| **Agent Container**    | Cloudflare Agents SDK    | Lifecycle management, WebSocket handling, state sync |
| **AI Orchestration**   | Vercel AI SDK            | LLM calls, tool execution, streaming responses       |
| **Backend Framework**  | Hono                     | Lightweight routing, middleware, API endpoints       |
| **Frontend Framework** | React Router v7          | Client routing, SSR-ready, file-based routes         |
| **UI Components**      | shadcn/ui + Tailwind CSS | Clean, accessible component library                  |
| **Language**           | TypeScript               | End-to-end type safety                               |

### Dependencies (Key Packages)

```json
{
  "agents": "^0.2.23",
  "ai": "^5.0.102",
  "@ai-sdk/openai": "^2.0.73",
  "@ai-sdk/react": "^1.2.12",
  "hono": "4.8.2",
  "react-router": "7.6.3",
  "wrangler": "4.50.0"
}
```

---

## Why This Stack?

### The Discovery

I stumbled onto this combination while trying to solve a specific problem: I wanted agents that could maintain conversation state, persist data, schedule tasks, and stream responses—all without managing infrastructure.

Cloudflare's Agent SDK, built on Durable Objects, gives you:

- **Per-user isolation**: Each user gets their own agent instance
- **Built-in SQLite**: Persistent storage without external databases
- **WebSocket support**: Real-time bidirectional communication
- **Automatic scaling**: From zero to millions without configuration

Vercel's AI SDK gives you:

- **Unified LLM interface**: Swap models without changing code
- **First-class streaming**: Built for incremental token delivery
- **Tool abstraction**: Define capabilities with schemas, let the AI decide when to use them
- **Agent primitives**: The `Experimental_Agent` class handles multi-step reasoning

Together, they form what I think is the most practical stack for building AI agents today. Cloudflare handles the "where does this agent live and how do I talk to it" problem. Vercel handles the "how does the agent think and act" problem.

### The Compatibility Challenge

Here's the thing nobody tells you: getting these two SDKs to work together smoothly requires understanding some subtle details about streaming protocols, serialization boundaries, and routing conventions.

When I first tried to return a `StreamTextResult` from a Durable Object RPC call, I got a cryptic `DataCloneError`. It turns out Durable Objects can only pass serializable data across their boundary—and stream objects aren't serializable. The fix is to call `.toTextStreamResponse()` inside the Durable Object and return the `Response` object instead.

When I used Vercel's `useCompletion` hook with an agent that returned plain text streams, I got parsing errors. Turns out `useCompletion` expects a specific data stream protocol by default. The fix is setting `streamProtocol: "text"` in the hook options.

I built this project so you don't have to debug these issues yourself. Every pattern here is tested and working.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend (React)                          │
├─────────────────────────────────────────────────────────────────────┤
│  useAgent (WebSocket)  │  useCompletion (HTTP)  │  useChat (HTTP)   │
└────────────┬───────────┴───────────┬────────────┴─────────┬─────────┘
             │                       │                      │
             ▼                       ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Hono API Layer                               │
├─────────────────────────────────────────────────────────────────────┤
│  /agents/* (routeAgentRequest)  │  /api/research  │  /api/custom    │
└────────────┬────────────────────┴────────┬────────┴────────┬────────┘
             │                             │                 │
             ▼                             ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Cloudflare Agent (Durable Object)                │
├─────────────────────────────────────────────────────────────────────┤
│  onMessage() ← WebSocket    │    onRequest() ← HTTP fetch           │
│  initiateAgent() ← RPC      │    Custom methods                     │
└────────────┬────────────────┴────────┬──────────────────────────────┘
             │                         │
             ▼                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Vercel AI Agent                              │
├─────────────────────────────────────────────────────────────────────┤
│  Model (GPT-4o)  │  System Prompt  │  Tools (weather, flights, etc) │
└─────────────────────────────────────────────────────────────────────┘
```

### How the Pieces Fit Together

1. **Frontend Layer**: React components use either Cloudflare's `useAgent` hook (WebSocket) or Vercel's `useCompletion`/`useChat` hooks (HTTP streaming) to communicate with agents.

2. **API Layer**: Hono routes handle incoming requests. The `routeAgentRequest()` function automatically routes WebSocket connections to the right agent. Custom API routes give you middleware control for authentication, validation, etc.

3. **Agent Layer**: Cloudflare Agent classes extend `Agent<Env>` and implement handlers like `onMessage()` (WebSocket), `onRequest()` (HTTP), or custom RPC methods. Each agent instance is a Durable Object—isolated, persistent, globally unique.

4. **AI Layer**: Inside the agent, a Vercel AI Agent handles the actual reasoning. You define tools, set a system prompt, choose a model, and stream responses back.

---

## The Four Integration Patterns

This project demonstrates four distinct ways to connect your frontend to AI agents. Each pattern has legitimate use cases—there's no single "right" answer.

### Pattern 1: WebSocket Real-time (useAgent)

**Route**: `direct-agent.tsx` → `/agents/:agent/:id`  
**Hook**: `useAgent()` from `agents/react`  
**Handler**: `onMessage()` in the Agent class

```typescript
// Frontend
import { useAgent } from "agents/react";

const connection = useAgent({
  agent: "research-agent",
  name: sessionId,
  onMessage: (msg) => {
    const data = JSON.parse(msg.data);
    if (data.type === "chunk") {
      setResponse((prev) => prev + data.content);
    }
  },
});

// Send a message
connection.send(JSON.stringify({ prompt: "Plan a trip to Tokyo" }));
```

```typescript
// Agent (onMessage handler)
async onMessage(connection: Connection, message: string) {
  const { prompt } = JSON.parse(message);
  const vercelAgent = this.createVercelAgent();
  const result = vercelAgent.stream({ prompt });

  for await (const chunk of result.textStream) {
    connection.send(JSON.stringify({ type: "chunk", content: chunk }));
  }
  connection.send(JSON.stringify({ type: "complete" }));
}
```

**When to use**:

- Chat interfaces requiring real-time updates
- Collaborative features where multiple clients need state sync
- Applications that need automatic reconnection handling

**Trade-offs**:

- More complex connection management
- Requires handling WebSocket lifecycle events
- Best for stateful, interactive applications

---

### Pattern 2: HTTP Streaming via API Route (useCompletion → onRequest)

**Route**: `http-streaming.tsx` → `/api/research`  
**Hook**: `useCompletion()` from `@ai-sdk/react`  
**Handler**: `onRequest()` in the Agent class

```typescript
// Frontend
import { useCompletion } from "@ai-sdk/react";

const { completion, complete, isLoading } = useCompletion({
  api: "/api/research",
  streamProtocol: "text", // ← Critical! Vercel Agent outputs plain text
});

await complete(prompt, {
  body: { prompt, userId: sessionId },
});
```

```typescript
// Hono API Route
app.post("/api/research", async (c) => {
  const { prompt, userId } = await c.req.json();
  const agent = await getAgentByName<Env, ResearchAgent>(
    c.env.ResearchAgent,
    userId
  );

  // Forward to agent's onRequest handler
  const agentRequest = new Request(c.req.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  return agent.fetch(agentRequest);
});
```

```typescript
// Agent (onRequest handler)
async onRequest(request: Request) {
  const { prompt } = await request.json<{ prompt: string }>();
  const vercelAgent = this.createVercelAgent();
  const result = vercelAgent.stream({ prompt });
  return result.toTextStreamResponse();
}
```

**When to use**:

- When you need middleware (auth, rate limiting, validation)
- RESTful architectures
- When you want full control over the request/response cycle

**Trade-offs**:

- Unidirectional (client → server → client)
- No built-in state synchronization
- More familiar pattern for REST developers

---

### Pattern 3: Direct RPC Method Invocation (useCompletion → custom method)

**Route**: `http-streaming-initiate.tsx` → `/api/research/initiate`  
**Hook**: `useCompletion()` from `@ai-sdk/react`  
**Handler**: Custom `initiateAgent()` method

```typescript
// Hono API Route
app.post("/api/research/initiate", async (c) => {
  const { prompt, userId } = await c.req.json();
  const agent = await getAgentByName<Env, ResearchAgent>(
    c.env.ResearchAgent,
    userId
  );

  // Call custom RPC method directly
  return (agent as any).initiateAgent(prompt);
});
```

```typescript
// Agent (custom RPC method)
initiateAgent(prompt: string): Response {
  const vercelAgent = this.createVercelAgent();
  const result = vercelAgent.stream({ prompt });

  // MUST return Response (serializable) - not StreamTextResult
  return result.toTextStreamResponse();
}
```

**When to use**:

- When you need multiple distinct entry points on one agent
- Cleaner method signatures without Request object parsing
- When different methods need different behaviors

**Trade-offs**:

- Must return serializable types (Response, not StreamTextResult)
- Slightly more boilerplate than onRequest
- TypeScript requires casting for custom methods

---

### Pattern 4: Auto-Routed Direct Access (useCompletion → /agents/\*)

**Route**: `http-direct.tsx` → `/agents/:agent/:id`  
**Hook**: `useCompletion()` from `@ai-sdk/react`  
**Handler**: `onRequest()` in the Agent class (via routeAgentRequest)

```typescript
// Frontend
const { completion, complete } = useCompletion({
  api: `/agents/${agentName}/${sessionId}`, // Direct to agent!
  streamProtocol: "text",
});

await complete(prompt, {
  body: { prompt },
});
```

```typescript
// Hono (no custom route needed - routeAgentRequest handles it)
app.all("/agents/*", async (c) => {
  return (
    (await routeAgentRequest(c.req.raw, c.env)) ||
    c.json({ error: "Agent not found" }, 404)
  );
});
```

**When to use**:

- Simplest possible setup
- Prototyping and MVPs
- When you don't need middleware processing

**Trade-offs**:

- Less control over request processing
- No middleware layer for auth/validation
- Direct exposure of agent endpoints

---

## Project Structure

```
cf-hono-rr7-agents/
├── workers/
│   ├── app.ts                    # Hono entry point, API routes
│   ├── agents/
│   │   ├── ResearchAgent.ts      # Travel planning agent
│   │   └── SupportAgent.ts       # (Placeholder for future)
│   └── tools/
│       └── index.ts              # Tool definitions (weather, flights, hotels)
├── app/
│   ├── routes/
│   │   ├── home.tsx              # Landing page with pattern overview
│   │   ├── direct-agent.tsx      # Pattern 1: WebSocket
│   │   ├── http-streaming.tsx    # Pattern 2: HTTP via API route
│   │   ├── http-streaming-initiate.tsx  # Pattern 3: RPC method
│   │   └── http-direct.tsx       # Pattern 4: Auto-routed
│   ├── routes.ts                 # Route definitions
│   └── components/ui/            # shadcn/ui components
├── docs/                         # Additional documentation
├── wrangler.jsonc                # Cloudflare configuration
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Cloudflare account
- An OpenAI API key (or modify to use another provider)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd cf-hono-rr7-agents

# Install dependencies
pnpm install

# Generate Cloudflare types
pnpm run cf-typegen
```

### Configuration

1. Create a `.dev.vars` file in the root:

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

2. The `wrangler.jsonc` already has the Durable Object bindings configured:

```jsonc
{
  "durable_objects": {
    "bindings": [
      { "name": "ResearchAgent", "class_name": "ResearchAgent" },
      { "name": "SupportAgent", "class_name": "SupportAgent" }
    ]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["ResearchAgent", "SupportAgent"] }
  ]
}
```

### Development

```bash
# Start the dev server
pnpm run dev
```

Visit `http://localhost:5173` to see the pattern overview and try each integration.

### Deployment

```bash
# Build and deploy to Cloudflare
pnpm run deploy
```

Don't forget to set your secrets in production:

```bash
wrangler secret put OPENAI_API_KEY
```

---

## Defining Your Own Agent

Here's how to create a new agent from scratch:

### 1. Create the Agent Class

```typescript
// workers/agents/MyAgent.ts
import { Agent, type Connection } from "agents";
import { Experimental_Agent as VercelAgent, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export class MyAgent extends Agent<Env> {
  private createVercelAgent() {
    return new VercelAgent({
      model: openai("gpt-4o"),
      system: "You are a helpful assistant that...",
      tools: {
        myTool: tool({
          description: "Does something useful",
          inputSchema: z.object({
            input: z.string().describe("The input parameter"),
          }),
          execute: async ({ input }) => {
            // Your tool logic here
            return { result: `Processed: ${input}` };
          },
        }),
      },
      stopWhen: stepCountIs(5), // Limit reasoning steps
    });
  }

  // Handle HTTP requests
  async onRequest(request: Request) {
    const { prompt } = await request.json<{ prompt: string }>();
    const vercelAgent = this.createVercelAgent();
    const result = vercelAgent.stream({ prompt });
    return result.toTextStreamResponse();
  }

  // Handle WebSocket messages
  async onMessage(connection: Connection, message: string) {
    const { prompt } = JSON.parse(message);
    const vercelAgent = this.createVercelAgent();
    const result = vercelAgent.stream({ prompt });

    for await (const chunk of result.textStream) {
      connection.send(JSON.stringify({ type: "chunk", content: chunk }));
    }
    connection.send(JSON.stringify({ type: "complete" }));
  }
}
```

### 2. Export and Configure

```typescript
// workers/app.ts
import { MyAgent } from "./agents/MyAgent";
export { MyAgent };
```

```jsonc
// wrangler.jsonc
{
  "durable_objects": {
    "bindings": [{ "name": "MyAgent", "class_name": "MyAgent" }]
  },
  "migrations": [{ "tag": "v2", "new_sqlite_classes": ["MyAgent"] }]
}
```

### 3. Add API Routes (Optional)

```typescript
// workers/app.ts
app.post("/api/my-agent", async (c) => {
  const { prompt, userId } = await c.req.json();
  const agent = await getAgentByName<Env, MyAgent>(c.env.MyAgent, userId);

  const request = new Request(c.req.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  return agent.fetch(request);
});
```

---

## Common Pitfalls & Solutions

### "Failed to parse stream string" Error

**Problem**: `useCompletion` expects the AI SDK's data stream protocol by default.

**Solution**: Add `streamProtocol: "text"` to your hook:

```typescript
const { completion, complete } = useCompletion({
  api: "/api/research",
  streamProtocol: "text", // ← This fixes it
});
```

### DataCloneError: Could not serialize object

**Problem**: Returning `StreamTextResult` from a Durable Object RPC method.

**Solution**: Call `.toTextStreamResponse()` inside the DO and return the `Response`:

```typescript
// Wrong
initiateAgent(prompt: string) {
  const result = vercelAgent.stream({ prompt });
  return result; // ← Can't serialize this
}

// Correct
initiateAgent(prompt: string): Response {
  const result = vercelAgent.stream({ prompt });
  return result.toTextStreamResponse(); // ← Returns serializable Response
}
```

### WebSocket Connection Fails with 404

**Problem**: `useAgent` connects to `/agents/:agent/:name` by default, but your routes might not match.

**Solution**: Ensure your Hono route for `routeAgentRequest` comes BEFORE React Router's catch-all:

```typescript
// Must be before the "*" catch-all route
app.all("/agents/*", async (c) => {
  return (
    (await routeAgentRequest(c.req.raw, c.env)) ||
    c.json({ error: "Agent not found" }, 404)
  );
});

// This catch-all should be last
app.get("*", (c) => {
  /* React Router handler */
});
```

### Agent Name Mismatch

**Problem**: `useAgent({ agent: "ResearchAgent" })` doesn't match what the SDK expects.

**Solution**: The agent name is kebab-cased and derived from the class name. `ResearchAgent` becomes `research-agent`:

```typescript
// Class name: ResearchAgent
useAgent({
  agent: "research-agent", // ← kebab-case
  name: sessionId,
});
```

---

## When to Use What

| Scenario                              | Recommended Pattern              |
| ------------------------------------- | -------------------------------- |
| Real-time chat with typing indicators | Pattern 1 (WebSocket)            |
| Simple completion forms               | Pattern 4 (Auto-routed HTTP)     |
| API with authentication middleware    | Pattern 2 (Custom API route)     |
| Multiple operations per agent         | Pattern 3 (RPC methods)          |
| Collaborative features                | Pattern 1 (WebSocket + setState) |
| REST-only architecture                | Pattern 2 or 4 (HTTP)            |
| Rapid prototyping                     | Pattern 4 (Auto-routed)          |

---

## Additional Resources

- [Cloudflare Agents SDK Documentation](https://developers.cloudflare.com/agents)
- [Vercel AI SDK Agents Guide](https://ai-sdk.dev/docs/agents/building-agents)
- [Hono Framework Documentation](https://hono.dev/)
- [React Router v7 Documentation](https://reactrouter.com/)

---

## Contributing

Found a bug? Have a pattern that should be included? Open an issue or PR.

---

## License

MIT

---

_Built by someone who got tired of debugging the same integration issues over and over, and decided to write them down instead._
