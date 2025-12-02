# Cloudflare Agents + Vercel AI SDK: Complete Technical Guide

This document provides a comprehensive technical deep-dive into building AI agents using Cloudflare's Agent SDK with Vercel's AI SDK. It covers architecture, implementation details, all four integration patterns, and complete code examples.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Concepts](#core-concepts)
3. [Project Setup](#project-setup)
4. [Wrangler Configuration](#wrangler-configuration)
5. [Building the Agent Class](#building-the-agent-class)
6. [Defining Tools](#defining-tools)
7. [API Routes with Hono](#api-routes-with-hono)
8. [🔌 WebSocket Patterns](#-websocket-patterns)
   - [Pattern 1: WebSocket Streaming](#pattern-1-websocket-streaming)
9. [🌐 HTTP Patterns](#-http-patterns)
   - [Pattern 2: Zero-Config HTTP](#pattern-2-zero-config-http)
   - [Pattern 3: HTTP with Middleware](#pattern-3-http-with-middleware)
   - [Pattern 4: Custom Agent Methods](#pattern-4-custom-agent-methods)
10. [Streaming Protocols & Serialization](#streaming-protocols--serialization)
11. [Common Errors & Solutions](#common-errors--solutions)
12. [Best Practices](#best-practices)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend (React)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   useAgent (WebSocket)      useCompletion (HTTP)       useChat (HTTP)       │
│   from agents/react         from @ai-sdk/react         from @ai-sdk/react   │
│                                                                             │
└─────────────┬───────────────────────┬──────────────────────┬────────────────┘
              │                       │                      │
              ▼                       ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Hono API Layer                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   /agents/* → routeAgentRequest()     /api/research → custom route          │
│   Handles WebSocket upgrades          Full middleware control               │
│   Auto-routes to agents               Authentication, validation            │
│                                                                             │
└─────────────┬───────────────────────┬──────────────────────┬────────────────┘
              │                       │                      │
              ▼                       ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Cloudflare Agent (Durable Object)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   class ResearchAgent extends Agent<Env> {                                  │
│                                                                             │
│     onMessage(connection, message)  ← WebSocket messages                    │
│     onRequest(request)              ← HTTP requests via agent.fetch()       │
│     initiateAgent(prompt)           ← Custom RPC method                     │
│                                                                             │
│     // State & Persistence                                                  │
│     this.sql                        ← Built-in SQLite                       │
│     this.setState() / this.state    ← Synchronized state                    │
│   }                                                                         │
│                                                                             │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Vercel AI Agent                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   new VercelAgent({                                                         │
│     model: openai('gpt-4o'),                                                │
│     system: 'You are a helpful assistant...',                               │
│     tools: { getWeather, getFlights, getHotels },                           │
│     stopWhen: stepCountIs(5)                                                │
│   })                                                                        │
│                                                                             │
│   vercelAgent.stream({ prompt })  → StreamTextResult                        │
│   result.toTextStreamResponse()   → Response (for HTTP)                     │
│   result.textStream               → AsyncIterable<string> (for WebSocket)   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

| Pattern | Name                 | Frontend Hook   | Transport | Route                    | Agent Handler     | Response Type            |
| ------- | -------------------- | --------------- | --------- | ------------------------ | ----------------- | ------------------------ |
| 1       | WebSocket Streaming  | `useAgent`      | WebSocket | `/agents/:agent/:id`     | `onMessage()`     | `connection.send()`      |
| 2       | Zero-Config HTTP     | `useCompletion` | HTTP      | `/agents/:agent/:id`     | `onRequest()`     | `toTextStreamResponse()` |
| 3       | HTTP with Middleware | `useCompletion` | HTTP      | `/api/research`          | `onRequest()`     | `toTextStreamResponse()` |
| 4       | Custom Agent Methods | `useCompletion` | HTTP      | `/api/research/initiate` | `initiateAgent()` | `toTextStreamResponse()` |

---

## Core Concepts

### Cloudflare Agent SDK

The Cloudflare Agent SDK provides:

- **Durable Objects**: Each agent instance is a globally unique, isolated process
- **Per-user isolation**: `getAgentByName(env.AgentClass, "user-123")` creates/retrieves an agent for that specific user
- **Built-in persistence**: SQLite database accessible via `this.sql`
- **WebSocket support**: Real-time bidirectional communication via `onMessage()`
- **State synchronization**: `this.setState()` broadcasts state changes to all connected clients
- **Automatic scaling**: Agents spin up on demand, hibernate when idle

### Vercel AI SDK

The Vercel AI SDK provides:

- **`Experimental_Agent`**: Multi-step reasoning with tool use
- **`tool()`**: Define capabilities with Zod schemas
- **`streamText()`**: Single-step streaming LLM calls
- **`useCompletion`/`useChat`**: React hooks for HTTP streaming
- **`toTextStreamResponse()`**: Convert stream to HTTP Response

### How They Work Together

Think of it this way:

| Component            | Role                                                         |
| -------------------- | ------------------------------------------------------------ |
| **Cloudflare Agent** | The "container" - manages lifecycle, state, connections      |
| **Vercel AI Agent**  | The "brain" - handles reasoning, tool calls, LLM interaction |

The Cloudflare Agent handles _where_ the agent runs and _how_ you talk to it. The Vercel AI Agent handles _what_ the agent thinks and _how_ it uses tools.

---

## Project Setup

### Directory Structure

```
cf-hono-rr7-agents/
├── workers/
│   ├── app.ts                          # Hono entry point
│   ├── agents/
│   │   ├── ResearchAgent.ts            # Agent class definition
│   │   └── SupportAgent.ts             # Additional agent
│   └── tools/
│       └── index.ts                    # Tool definitions
├── app/
│   ├── routes/
│   │   ├── home.tsx                    # Landing page
│   │   ├── direct-agent.tsx            # Pattern 1 demo
│   │   ├── http-streaming.tsx          # Pattern 2 demo
│   │   ├── http-streaming-initiate.tsx # Pattern 3 demo
│   │   └── http-direct.tsx             # Pattern 4 demo
│   └── routes.ts                       # Route definitions
├── wrangler.jsonc                      # Cloudflare configuration
└── package.json
```

### Dependencies

```json
{
  "dependencies": {
    "agents": "^0.2.23",
    "ai": "^5.0.102",
    "@ai-sdk/openai": "^2.0.73",
    "@ai-sdk/react": "^1.2.12",
    "hono": "4.8.2",
    "react-router": "7.6.3",
    "zod": "^4.1.13"
  },
  "devDependencies": {
    "@cloudflare/vite-plugin": "1.15.2",
    "@cloudflare/workers-types": "^4.20251114.0",
    "wrangler": "4.50.0"
  }
}
```

### Installation

```bash
# Clone and install
git clone <repository-url>
cd cf-hono-rr7-agents
pnpm install

# Generate Cloudflare types
pnpm run cf-typegen

# Create environment file
echo "OPENAI_API_KEY=sk-your-key-here" > .dev.vars

# Start development server
pnpm run dev
```

---

## Wrangler Configuration

The `wrangler.jsonc` file configures Cloudflare Workers and Durable Objects:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "cf-hono-rr7-agents",
  "compatibility_date": "2025-10-08",
  "compatibility_flags": ["nodejs_compat"],
  "main": "./workers/app.ts",

  // Environment variables (non-sensitive)
  "vars": {
    "VALUE_FROM_CLOUDFLARE": "Hello from Hono/CF"
  },

  // Durable Object bindings - expose agent classes to your Worker
  "durable_objects": {
    "bindings": [
      {
        "name": "ResearchAgent", // How you reference it in code: env.ResearchAgent
        "class_name": "ResearchAgent" // The exported class name
      },
      {
        "name": "SupportAgent",
        "class_name": "SupportAgent"
      }
    ]
  },

  // Migrations - required when adding new DO classes with SQLite
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["ResearchAgent", "SupportAgent"]
    }
  ],

  "observability": {
    "enabled": true
  },

  "upload_source_maps": true
}
```

### Key Configuration Points

1. **`compatibility_flags: ["nodejs_compat"]`**: Required for Node.js APIs used by the AI SDK
2. **`durable_objects.bindings`**: Creates the `env.ResearchAgent` binding
3. **`migrations`**: Required when your DO uses SQLite (the Cloudflare Agent SDK uses SQLite internally)

### Adding a New Agent

When adding a new agent class:

1. Create the class file in `workers/agents/`
2. Export it from `workers/app.ts`
3. Add binding to `durable_objects.bindings`
4. Add migration with incremented tag (`v2`, `v3`, etc.)

```jsonc
{
  "durable_objects": {
    "bindings": [
      // ... existing bindings ...
      { "name": "NewAgent", "class_name": "NewAgent" }
    ]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["ResearchAgent", "SupportAgent"] },
    { "tag": "v2", "new_sqlite_classes": ["NewAgent"] } // New migration
  ]
}
```

---

## Building the Agent Class

Here's the complete `ResearchAgent` implementation:

```typescript
// workers/agents/ResearchAgent.ts

import { Agent } from "agents";
import type { Connection } from "agents";
import {
  stepCountIs,
  Experimental_Agent as VercelAgent,
  type ToolSet,
  type StreamTextResult,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { tools } from "workers/tools";

export class ResearchAgent extends Agent<Env> {
  /**
   * Factory method to create a configured Vercel AI Agent.
   * Called fresh for each request to ensure clean state.
   */
  private createVercelAgent() {
    return new VercelAgent({
      // LLM model - can be swapped for anthropic(), etc.
      model: openai("gpt-4o-2024-11-20"),

      // System prompt defines agent behavior
      system:
        "You are a travel planning assistant. Help users plan their trips by providing weather information, flight options, and hotel recommendations.",

      // Tools the agent can use (defined in workers/tools/index.ts)
      tools: tools as ToolSet,

      // Stop condition - prevents infinite loops
      stopWhen: stepCountIs(5),
    });
  }

  /**
   * HTTP Request Handler
   *
   * Triggered when:
   * - agent.fetch(request) is called from an API route
   * - Direct HTTP POST to /agents/:agent/:id (via routeAgentRequest)
   *
   * Used by: Pattern 2, Pattern 4
   */
  async onRequest(request: Request) {
    // Parse the prompt from request body
    const { prompt } = await request.json<{ prompt: string }>();
    const userPrompt =
      prompt || "Plan a trip to Paris - I need weather, flights, and hotels";

    // Create fresh agent instance and stream response
    const vercelAgent = this.createVercelAgent();
    const result = vercelAgent.stream({ prompt: userPrompt });

    // Convert to HTTP streaming response
    // This is what useCompletion expects on the frontend
    return result.toTextStreamResponse();
  }

  /**
   * WebSocket Message Handler
   *
   * Triggered when:
   * - Client sends a message via useAgent's connection.send()
   *
   * Used by: Pattern 1
   *
   * @param connection - WebSocket connection to the client
   * @param message - Raw message string from client
   */
  async onMessage(connection: Connection, message: string) {
    try {
      // Parse the incoming message (expected format: { prompt: "..." })
      const { prompt } = JSON.parse(message) as { prompt: string };

      const vercelAgent = this.createVercelAgent();
      const result = vercelAgent.stream({ prompt });

      // Stream chunks back through WebSocket
      // This allows real-time updates as the LLM generates text
      for await (const chunk of result.textStream) {
        connection.send(
          JSON.stringify({
            type: "chunk",
            content: chunk,
          })
        );
      }

      // Signal completion so frontend knows streaming is done
      connection.send(JSON.stringify({ type: "complete" }));
    } catch (error) {
      // Send error back to client
      connection.send(
        JSON.stringify({
          type: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        })
      );
    }
  }

  /**
   * Custom RPC Method
   *
   * Triggered when:
   * - Called directly: (agent as any).initiateAgent(prompt)
   *
   * Used by: Pattern 3
   *
   * IMPORTANT: Must return a Response object, not StreamTextResult.
   * Durable Objects can only pass serializable data across their boundary.
   * StreamTextResult is not serializable, but Response is.
   *
   * @param prompt - The user's prompt
   * @returns Response - HTTP streaming response
   */
  initiateAgent(prompt: string): Response {
    const userPrompt =
      prompt || "Plan a trip to Paris - I need weather, flights, and hotels";

    const vercelAgent = this.createVercelAgent();
    const result = vercelAgent.stream({ prompt: userPrompt });

    // MUST return Response (serializable) - can't return StreamTextResult across DO boundary
    return result.toTextStreamResponse();
  }
}
```

### Handler Comparison

| Handler           | Trigger                           | Input             | Output              | Use Case                |
| ----------------- | --------------------------------- | ----------------- | ------------------- | ----------------------- |
| `onRequest()`     | `agent.fetch(req)` or direct HTTP | `Request` object  | `Response`          | Standard HTTP streaming |
| `onMessage()`     | WebSocket message                 | Raw string        | `connection.send()` | Real-time bidirectional |
| `initiateAgent()` | Direct RPC call                   | Method parameters | `Response`          | Custom entry points     |

---

## Defining Tools

Tools give your agent capabilities beyond text generation. Here's the complete tool definitions:

```typescript
// workers/tools/index.ts

import { tool, type ToolSet } from "ai";
import { z } from "zod";

/**
 * Weather Tool
 *
 * The LLM will call this when users ask about weather.
 * Input schema is validated by Zod before execution.
 */
export const getWeatherTool = tool({
  // Description helps the LLM understand when to use this tool
  description: "Get weather for a city",

  // Zod schema for input validation
  inputSchema: z.object({
    city: z.string().describe("The city name to get weather for"),
  }),

  // Async execute function - does the actual work
  async execute({ city }) {
    console.log(`Fetching weather for ${city}...`);

    // Simulate API call delay
    await new Promise((r) => setTimeout(r, 1000));

    // In production, call a real weather API
    return {
      city,
      temp: 72,
      conditions: "sunny",
    };
  },
});

/**
 * Flights Tool
 */
export const getFlightsTool = tool({
  description: "Search flights to a city",
  inputSchema: z.object({
    destination: z.string().describe("The destination city"),
  }),
  async execute({ destination }) {
    console.log(`Searching flights to ${destination}...`);
    await new Promise((r) => setTimeout(r, 1500));
    return {
      destination,
      price: 350,
      airline: "CloudAir",
    };
  },
});

/**
 * Hotels Tool
 */
export const getHotelsTool = tool({
  description: "Search hotels in a city",
  inputSchema: z.object({
    city: z.string().describe("The city to search hotels in"),
  }),
  async execute({ city }) {
    console.log(`Finding hotels in ${city}...`);
    await new Promise((r) => setTimeout(r, 1200));
    return {
      city,
      avgPrice: 120,
      topPick: "Grand Hotel",
    };
  },
});

// Export as ToolSet for type safety
export const tools = {
  getWeatherTool,
  getFlightsTool,
  getHotelsTool,
} satisfies ToolSet;
```

### Tool Anatomy

```typescript
tool({
  description: string, // Helps LLM decide when to use
  inputSchema: ZodSchema, // Validates input from LLM
  execute: async (input) => result, // Actual implementation
});
```

### Tool Execution Flow

1. User asks: "What's the weather in Tokyo?"
2. LLM recognizes need for weather data
3. LLM generates tool call: `{ tool: "getWeatherTool", args: { city: "Tokyo" } }`
4. AI SDK validates args against Zod schema
5. `execute()` function runs
6. Result returned to LLM
7. LLM incorporates result into response

---

## API Routes with Hono

The `workers/app.ts` file is the entry point for your Worker:

```typescript
// workers/app.ts

import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { getAgentByName, routeAgentRequest } from "agents";

// Import agent classes (must be exported for Durable Objects to work)
import { SupportAgent } from "./agents/SupportAgent";
import { ResearchAgent } from "./agents/ResearchAgent";

// Create Hono app with Cloudflare bindings type
const app = new Hono<{ Bindings: Env }>();

// ============================================================================
// API Routes
// ============================================================================

/**
 * Simple health check endpoint
 */
app.get("/api/hello", (c) => {
  return c.text("Hello World");
});

/**
 * ENDPOINT 1: Agent WebSocket & HTTP Routing
 *
 * This single route handles BOTH:
 * - WebSocket upgrades for useAgent() connections
 * - HTTP POST requests for direct agent access
 *
 * routeAgentRequest() automatically:
 * - Parses the URL pattern: /agents/:agent/:name
 * - Looks up the Durable Object binding (e.g., env.ResearchAgent)
 * - Upgrades to WebSocket if requested, otherwise forwards HTTP
 * - Routes to the appropriate agent instance
 *
 * IMPORTANT: Must be defined BEFORE the React Router catch-all!
 */
app.all("/agents/*", async (c) => {
  return (
    (await routeAgentRequest(c.req.raw, c.env)) ||
    c.json({ error: "Agent not found" }, 404)
  );
});

/**
 * ENDPOINT 2: Custom API Route for HTTP Streaming
 *
 * Use case: When you need middleware processing before reaching the agent
 * - Authentication
 * - Request validation
 * - Rate limiting
 * - Logging
 * - Custom response formatting
 *
 * Frontend usage:
 *   const { completion } = useCompletion({
 *     api: "/api/research",
 *     streamProtocol: "text"
 *   });
 */
app.post("/api/research", async (c) => {
  // Extract prompt and userId from request body
  const { prompt, userId } = await c.req.json<{
    prompt: string;
    userId?: string;
  }>();

  // Get or create agent instance for this user
  // The agentId determines which Durable Object instance to use
  const agentId = userId || "default";
  const agent = await getAgentByName<Env, ResearchAgent>(
    c.env.ResearchAgent, // The Durable Object binding from wrangler.jsonc
    agentId // Unique identifier for this agent instance
  );

  // Create a new Request to forward to the agent
  // This triggers the agent's onRequest() handler
  const agentRequest = new Request(c.req.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  // agent.fetch() calls the agent's onRequest() method
  // The response is already a streaming Response from toTextStreamResponse()
  return agent.fetch(agentRequest);
});

/**
 * ENDPOINT 3: Direct RPC Method Invocation
 *
 * Demonstrates calling a custom method on the agent directly,
 * instead of using the built-in onRequest handler.
 *
 * Key differences:
 * - /api/research: agent.fetch(request) → onRequest()
 * - /api/research/initiate: agent.initiateAgent(prompt) → custom RPC
 *
 * Use case: When you want multiple distinct operations on one agent
 */
app.post("/api/research/initiate", async (c) => {
  const { prompt, userId } = await c.req.json<{
    prompt: string;
    userId?: string;
  }>();

  const agentId = userId || "default";
  const agent = await getAgentByName<Env, ResearchAgent>(
    c.env.ResearchAgent,
    agentId
  );

  // Call custom RPC method directly
  // TypeScript doesn't know about custom methods, so we cast
  // The method returns a Response (must be serializable across DO boundary)
  return (agent as any).initiateAgent(prompt);
});

// ============================================================================
// Export Agent Classes (Required for Durable Objects)
// ============================================================================

export { SupportAgent, ResearchAgent };

// ============================================================================
// React Router Handler (Catch-all for frontend)
// ============================================================================

/**
 * This MUST be the last route!
 * All unmatched requests go to React Router for frontend rendering
 */
app.get("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE
  );

  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

export default app;
```

### Route Order Matters

```typescript
// ✅ CORRECT ORDER
app.all("/agents/*", ...);     // Agent routes first
app.post("/api/research", ...); // Custom API routes
app.get("*", ...);              // React Router catch-all LAST

// ❌ WRONG ORDER - catch-all intercepts agent requests
app.get("*", ...);              // This catches /agents/* requests!
app.all("/agents/*", ...);      // Never reached
```

---

## 🔌 WebSocket Patterns

Persistent bidirectional connections for real-time communication.

---

## Pattern 1: WebSocket Streaming

This pattern establishes a persistent WebSocket connection for bidirectional real-time communication.

### Frontend Implementation

```typescript
// app/routes/direct-agent.tsx

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router";
import { useAgent } from "agents/react";

export default function DirectAgentPage() {
  const [searchParams] = useSearchParams();
  const agent = searchParams.get("agent") || "research";

  // Generate unique session ID once on page load
  // This ID determines which agent instance to connect to
  const [sessionId] = useState<string>(() =>
    Math.random().toString(36).substring(2, 8)
  );

  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Agent names are kebab-cased versions of class names
  // ResearchAgent → "research-agent"
  const agentName = agent === "research" ? "research-agent" : "support-agent";

  // useAgent establishes WebSocket connection to /agents/:agent/:name
  const connection = useAgent({
    agent: agentName, // Maps to agent class
    name: sessionId, // Unique instance identifier

    // Called when agent sends a message
    onMessage: (message) => {
      try {
        const data = JSON.parse(message.data);

        if (data.type === "chunk") {
          // Append streamed text chunk
          setResponse((prev) => prev + data.content);
        } else if (data.type === "complete") {
          // Streaming finished
          setIsStreaming(false);
        } else if (data.type === "error") {
          // Agent sent an error
          setError(data.message);
          setIsStreaming(false);
        }
      } catch {
        // Handle non-JSON messages (raw text)
        setResponse((prev) => prev + message.data);
      }
    },

    // Connection lifecycle events
    onOpen: () => {
      console.log("WebSocket connected to agent:", agentName, sessionId);
    },
    onClose: () => {
      console.log("WebSocket closed");
      setIsStreaming(false);
    },
    onError: (err) => {
      console.error("WebSocket error:", err);
      setError("WebSocket connection failed");
      setIsStreaming(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !connection) return;

    // Clear previous response
    setResponse("");
    setError(null);
    setIsStreaming(true);

    // Send message to agent via WebSocket
    // This triggers agent's onMessage() handler
    connection.send(JSON.stringify({ prompt: prompt.trim() }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={isStreaming}
      />
      <button type="submit" disabled={!prompt.trim() || isStreaming}>
        {isStreaming ? "Streaming..." : "Send Message"}
      </button>
      <div>{response}</div>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

### Backend Handler (Agent)

```typescript
// In ResearchAgent class

async onMessage(connection: Connection, message: string) {
  try {
    const { prompt } = JSON.parse(message) as { prompt: string };

    const vercelAgent = this.createVercelAgent();
    const result = vercelAgent.stream({ prompt });

    // Stream chunks individually through WebSocket
    for await (const chunk of result.textStream) {
      connection.send(JSON.stringify({
        type: "chunk",
        content: chunk
      }));
    }

    connection.send(JSON.stringify({ type: "complete" }));
  } catch (error) {
    connection.send(JSON.stringify({
      type: "error",
      message: error instanceof Error ? error.message : "Unknown error"
    }));
  }
}
```

### Request Flow Diagram

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│    Frontend     │         │   Hono Router   │         │  ResearchAgent  │
│                 │         │                 │         │  (Durable Obj)  │
└────────┬────────┘         └────────┬────────┘         └────────┬────────┘
         │                           │                           │
         │  1. useAgent() connects   │                           │
         │  GET /agents/research-    │                           │
         │      agent/abc123         │                           │
         │  Upgrade: websocket       │                           │
         │ ─────────────────────────>│                           │
         │                           │                           │
         │                           │  2. routeAgentRequest()   │
         │                           │     upgrades connection   │
         │                           │ ─────────────────────────>│
         │                           │                           │
         │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
         │       WebSocket established                           │
         │                                                       │
         │  3. connection.send({prompt})                         │
         │ ─────────────────────────────────────────────────────>│
         │                                                       │
         │                           │  4. onMessage() called    │
         │                           │     Creates VercelAgent   │
         │                           │     Streams LLM response  │
         │                                                       │
         │  5. {type:"chunk", content:"Here's..."}               │
         │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
         │  6. {type:"chunk", content:"what..."}                 │
         │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
         │  7. {type:"complete"}                                 │
         │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
```

---

## 🌐 HTTP Patterns

Request-response streaming, ordered from simplest to most flexible.

---

## Pattern 2: Zero-Config HTTP

This is the simplest pattern—frontend talks directly to the agent without any custom API routes.

### Frontend Implementation

```typescript
// app/routes/http-direct.tsx

import { useState } from "react";
import { useSearchParams } from "react-router";
import { useCompletion } from "@ai-sdk/react";

export default function HttpDirectPage() {
  const [searchParams] = useSearchParams();
  const agent = searchParams.get("agent") || "research";

  const [sessionId] = useState<string>(() =>
    Math.random().toString(36).substring(2, 8)
  );
  const [prompt, setPrompt] = useState("");

  // Agent name is kebab-cased
  const agentName = agent === "research" ? "research-agent" : "support-agent";

  const { completion, complete, isLoading, error } = useCompletion({
    // Point DIRECTLY to the agent URL pattern
    // No custom Hono route needed!
    api: `/agents/${agentName}/${sessionId}`,
    streamProtocol: "text",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    await complete(prompt.trim(), {
      body: { prompt: prompt.trim() },
    });
  };

  // ... rendering
}
```

### Backend (No Custom Route Needed)

The existing `routeAgentRequest()` middleware handles everything:

```typescript
// workers/app.ts

// This single route handles direct HTTP access
app.all("/agents/*", async (c) => {
  return (
    (await routeAgentRequest(c.req.raw, c.env)) ||
    c.json({ error: "Agent not found" }, 404)
  );
});
```

### How It Works

1. Frontend POSTs to `/agents/research-agent/abc123`
2. `routeAgentRequest()` parses the URL:
   - Agent class: `research-agent` → `ResearchAgent`
   - Instance ID: `abc123`
3. Looks up `env.ResearchAgent` binding
4. Forwards request to that agent instance
5. Agent's `onRequest()` handles it
6. Response streams back to frontend

### Trade-offs

| Pros               | Cons                     |
| ------------------ | ------------------------ |
| Simplest setup     | No middleware layer      |
| Zero configuration | No auth/validation       |
| Fast prototyping   | Direct endpoint exposure |
| Less code          | Less control             |

---

## Pattern 3: HTTP with Middleware

This pattern uses standard HTTP with streaming responses, routed through a custom Hono endpoint for full middleware control.

### Frontend Implementation

```typescript
// app/routes/http-streaming.tsx

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { useCompletion } from "@ai-sdk/react";

export default function HttpStreamingPage() {
  const [searchParams] = useSearchParams();
  const agent = searchParams.get("agent") || "research";

  // Generate unique session ID
  const [sessionId] = useState<string>(() =>
    Math.random().toString(36).substring(2, 8)
  );
  const [prompt, setPrompt] = useState("");

  // useCompletion hook from Vercel AI SDK
  const { completion, complete, isLoading, error } = useCompletion({
    // Points to our custom Hono route
    api: "/api/research",

    // CRITICAL: Vercel Agent outputs plain text, not data stream protocol
    // Without this, you'll get "Failed to parse stream string" errors
    streamProtocol: "text",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    // complete() sends POST request with body to the API
    await complete(prompt.trim(), {
      body: {
        prompt: prompt.trim(),
        userId: sessionId, // Used to identify agent instance
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={isLoading}
      />
      <button type="submit" disabled={!prompt.trim() || isLoading}>
        {isLoading ? "Streaming..." : "Send Message"}
      </button>

      {/* completion is automatically updated as stream arrives */}
      <div>{completion}</div>

      {error && <div className="error">{error.message}</div>}
    </form>
  );
}
```

### Backend Implementation (Hono Route)

```typescript
// workers/app.ts

app.post("/api/research", async (c) => {
  const { prompt, userId } = await c.req.json<{
    prompt: string;
    userId?: string;
  }>();

  // Get or create agent for this user
  const agentId = userId || "default";
  const agent = await getAgentByName<Env, ResearchAgent>(
    c.env.ResearchAgent,
    agentId
  );

  // Create request to forward to agent
  const agentRequest = new Request(c.req.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  // agent.fetch() triggers onRequest() and returns streaming Response
  return agent.fetch(agentRequest);
});
```

### Backend Handler (Agent)

```typescript
// In ResearchAgent class

async onRequest(request: Request) {
  const { prompt } = await request.json<{ prompt: string }>();
  const userPrompt = prompt || "Plan a trip to Paris";

  const vercelAgent = this.createVercelAgent();
  const result = vercelAgent.stream({ prompt: userPrompt });

  // toTextStreamResponse() creates an HTTP Response with:
  // - Content-Type: text/plain; charset=utf-8
  // - Transfer-Encoding: chunked
  // - Body: streaming text chunks
  return result.toTextStreamResponse();
}
```

### Request Flow Diagram

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│    Frontend     │         │   Hono Router   │         │  ResearchAgent  │
│  useCompletion  │         │  /api/research  │         │  (Durable Obj)  │
└────────┬────────┘         └────────┬────────┘         └────────┬────────┘
         │                           │                           │
         │  1. POST /api/research    │                           │
         │  {prompt, userId}         │                           │
         │ ─────────────────────────>│                           │
         │                           │                           │
         │                           │  2. getAgentByName()      │
         │                           │     agent.fetch(request)  │
         │                           │ ─────────────────────────>│
         │                           │                           │
         │                           │                           │  3. onRequest()
         │                           │                           │     vercelAgent.stream()
         │                           │                           │     toTextStreamResponse()
         │                           │                           │
         │                           │  4. Streaming Response    │
         │                           │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
         │                           │                           │
         │  5. Stream chunks         │                           │
         │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                           │
         │  (completion updates)     │                           │
```

---

## Pattern 4: Custom Agent Methods

This pattern demonstrates calling custom methods on the agent directly, without going through `onRequest()`.

### Frontend Implementation

```typescript
// app/routes/http-streaming-initiate.tsx

import { useState } from "react";
import { useCompletion } from "@ai-sdk/react";

export default function HttpStreamingInitiatePage() {
  const [sessionId] = useState<string>(() =>
    Math.random().toString(36).substring(2, 8)
  );
  const [prompt, setPrompt] = useState("");

  const { completion, complete, isLoading, error } = useCompletion({
    // Points to the RPC endpoint
    api: "/api/research/initiate",
    streamProtocol: "text",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    await complete(prompt.trim(), {
      body: {
        prompt: prompt.trim(),
        userId: sessionId,
      },
    });
  };

  // ... same rendering as Pattern 3
}
```

### Backend Implementation (Hono Route)

```typescript
// workers/app.ts

app.post("/api/research/initiate", async (c) => {
  const { prompt, userId } = await c.req.json<{
    prompt: string;
    userId?: string;
  }>();

  const agentId = userId || "default";
  const agent = await getAgentByName<Env, ResearchAgent>(
    c.env.ResearchAgent,
    agentId
  );

  // Call custom RPC method directly
  // Note: TypeScript doesn't know about custom methods, so we cast
  return (agent as any).initiateAgent(prompt);
});
```

### Backend Handler (Agent Custom Method)

```typescript
// In ResearchAgent class

/**
 * Custom RPC Method
 *
 * IMPORTANT: Must return Response, not StreamTextResult!
 *
 * Durable Objects serialize data when passing across their boundary.
 * StreamTextResult is not serializable, but Response is.
 */
initiateAgent(prompt: string): Response {
  const userPrompt = prompt || "Plan a trip to Paris";

  const vercelAgent = this.createVercelAgent();
  const result = vercelAgent.stream({ prompt: userPrompt });

  // Convert to Response INSIDE the Durable Object
  return result.toTextStreamResponse();
}
```

### Why Use Custom Agent Methods?

1. **Multiple entry points**: One agent class, multiple operations

   ```typescript
   agent.searchFlights(destination);
   agent.bookHotel(hotelId);
   agent.getItinerary();
   ```

2. **Cleaner signatures**: No need to parse Request objects

   ```typescript
   // Instead of:
   onRequest(request: Request) {
     const { action, ...params } = await request.json();
     if (action === 'search') { ... }
   }

   // You can have:
   searchFlights(destination: string): Response
   bookHotel(hotelId: string): Response
   ```

3. **Type safety**: Method parameters are typed (though you need casting at the call site)

---

## Streaming Protocols & Serialization

### Stream Protocol Options

When using `useCompletion` or `useChat`, you must match the stream protocol to what your backend returns:

```typescript
// Frontend
const { completion } = useCompletion({
  api: "/api/research",
  streamProtocol: "text", // or "data" (default)
});
```

| Protocol           | Backend Returns                   | Use With              |
| ------------------ | --------------------------------- | --------------------- |
| `"text"`           | `toTextStreamResponse()`          | Vercel AI Agent       |
| `"data"` (default) | `streamText()` with data protocol | Vercel `streamText()` |

### Vercel Agent Always Uses Text Protocol

```typescript
// Vercel Agent's stream() returns StreamTextResult
const result = vercelAgent.stream({ prompt });

// toTextStreamResponse() creates plain text stream
result.toTextStreamResponse(); // Content-Type: text/plain
```

If you use `streamProtocol: "data"` (the default), you'll get:

```
Error: Failed to parse stream string. Invalid code "Here's what I found..."
```

### Durable Object Serialization

Durable Objects can only pass serializable data across their boundary. This affects custom RPC methods:

```typescript
// ❌ WRONG - StreamTextResult is not serializable
initiateAgent(prompt: string) {
  const result = vercelAgent.stream({ prompt });
  return result;  // DataCloneError!
}

// ✅ CORRECT - Response is serializable
initiateAgent(prompt: string): Response {
  const result = vercelAgent.stream({ prompt });
  return result.toTextStreamResponse();  // Works!
}
```

---

## Common Errors & Solutions

### Error: "Failed to parse stream string"

**Cause**: `useCompletion` expects data stream protocol, but agent returns plain text.

**Solution**:

```typescript
const { completion } = useCompletion({
  api: "/api/research",
  streamProtocol: "text", // Add this!
});
```

### Error: "DataCloneError: Could not serialize object"

**Cause**: Returning non-serializable object from Durable Object RPC method.

**Solution**: Return `Response` instead of `StreamTextResult`:

```typescript
// Convert inside the DO method
return result.toTextStreamResponse();
```

### Error: WebSocket 404 or "No routes matched"

**Cause**: Agent route defined after React Router catch-all, or wrong URL pattern.

**Solution**:

1. Define `/agents/*` route BEFORE `*` catch-all
2. Use kebab-case agent names: `research-agent` not `ResearchAgent`

```typescript
// Correct order
app.all("/agents/*", ...);  // First
app.get("*", ...);          // Last
```

### Error: "Agent not found"

**Cause**: Agent class not exported or binding not configured.

**Solution**:

1. Export class from `workers/app.ts`:
   ```typescript
   export { ResearchAgent };
   ```
2. Add binding in `wrangler.jsonc`:
   ```jsonc
   "durable_objects": {
     "bindings": [
       { "name": "ResearchAgent", "class_name": "ResearchAgent" }
     ]
   }
   ```

---

## Best Practices

### 1. One Pattern Per Interface

Don't mix WebSocket and HTTP in the same UI. Pick one and stick with it.

### 2. User-Specific Agent Instances

Always use a unique ID per user/session:

```typescript
// Good - user isolation
const agent = await getAgentByName(env.Agent, userId);

// Bad - shared state
const agent = await getAgentByName(env.Agent, "default");
```

### 3. Error Handling

Always wrap agent operations in try-catch:

```typescript
async onMessage(connection: Connection, message: string) {
  try {
    // ... agent logic
  } catch (error) {
    connection.send(JSON.stringify({
      type: "error",
      message: error instanceof Error ? error.message : "Unknown error"
    }));
  }
}
```

### 4. Limit Reasoning Steps

Prevent infinite loops with `stopWhen`:

```typescript
new VercelAgent({
  // ...
  stopWhen: stepCountIs(5), // Max 5 reasoning steps
});
```

### 5. Keep Agent Logic Separate

- **Hono routes**: Auth, validation, routing
- **Agent class**: Business logic, AI orchestration
- **Tools**: External integrations, data fetching

### 6. Type Safety

Generate and use Cloudflare types:

```bash
pnpm run cf-typegen
```

```typescript
// workers/app.ts
const app = new Hono<{ Bindings: Env }>(); // Use generated Env type
```

---

## Summary

| Pattern | Name                 | Best For            | Hook            | Transport | Complexity |
| ------- | -------------------- | ------------------- | --------------- | --------- | ---------- |
| 1       | WebSocket Streaming  | Real-time chat      | `useAgent`      | WebSocket | Higher     |
| 2       | Zero-Config HTTP     | Quick prototypes    | `useCompletion` | HTTP      | Lowest     |
| 3       | HTTP with Middleware | Auth/validation     | `useCompletion` | HTTP      | Medium     |
| 4       | Custom Agent Methods | Multiple operations | `useCompletion` | HTTP      | Medium     |

Choose based on your requirements:

- **Need real-time updates?** → Pattern 1 (WebSocket Streaming)
- **Need simplicity?** → Pattern 2 (Zero-Config HTTP)
- **Need auth middleware?** → Pattern 3 (HTTP with Middleware)
- **Need multiple operations?** → Pattern 4 (Custom Agent Methods)
