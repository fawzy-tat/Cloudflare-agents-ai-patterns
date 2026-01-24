---
name: cloudflare-agent-routing-patterns
description: Comprehensive guide to all patterns for integrating and communicating with Cloudflare Agents from frontends and APIs. Use when implementing agent communication, setting up WebSocket or HTTP streaming, configuring Hono routes for agents, or troubleshooting agent integration issues.
---

# Cloudflare Agent Routing Patterns

This skill covers all the patterns for integrating Cloudflare Agents with React frontends and APIs using Hono, React Router, and the Vercel AI SDK.

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
│   class MyAgent extends Agent<Env> {                                        │
│                                                                             │
│     onMessage(connection, message)  ← WebSocket messages                    │
│     onRequest(request)              ← HTTP requests via agent.fetch()       │
│     customMethod(args)              ← Custom RPC method                     │
│   }                                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Pattern Summary

| Pattern | Name                 | Frontend Hook   | Transport | Route                    | Agent Handler     | Best For                |
| ------- | -------------------- | --------------- | --------- | ------------------------ | ----------------- | ----------------------- |
| 1       | Zero-Config HTTP     | `useCompletion` | HTTP      | `/agents/:agent/:id`     | `onRequest()`     | Quick prototypes        |
| 2       | HTTP with Middleware | `useCompletion` | HTTP      | `/api/custom`            | `onRequest()`     | Auth/validation         |
| 3       | Custom RPC Methods   | `useCompletion` | HTTP      | `/api/custom/action`     | `customMethod()`  | Multiple operations     |
| 4       | WebSocket Streaming  | `useAgent`      | WebSocket | `/agents/:agent/:id`     | `onMessage()`     | Real-time bidirectional |
| 5       | Generative UI        | `useChat`       | HTTP      | `/api/chat`              | `streamText()`    | Rich UI components      |
| 6       | Object Streaming     | `useObject`     | HTTP      | `/api/stream-object`     | `streamObject()`  | Structured data         |

---

## Pattern 1: Zero-Config HTTP (Direct Agent Access)

The simplest pattern—frontend talks directly to the agent without custom API routes.

### Frontend Implementation

```typescript
import { useState } from "react";
import { useCompletion } from "@ai-sdk/react";

export default function DirectAgentPage() {
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 8));
  const [prompt, setPrompt] = useState("");
  
  // Agent name is kebab-case of class name: ResearchAgent → "research-agent"
  const agentName = "research-agent";

  const { completion, complete, isLoading, error } = useCompletion({
    // Point DIRECTLY to the agent URL pattern - no custom route needed
    api: `/agents/${agentName}/${sessionId}`,
    streamProtocol: "text", // CRITICAL: Vercel Agent outputs plain text
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await complete("", {
      body: { prompt: prompt.trim() },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <button type="submit" disabled={isLoading}>Send</button>
      <div>{completion}</div>
    </form>
  );
}
```

### Backend (Hono Route)

```typescript
import { Hono } from "hono";
import { routeAgentRequest } from "agents";

const app = new Hono<{ Bindings: Env }>();

// This single route handles direct HTTP and WebSocket access
app.all("/agents/*", async (c) => {
  return (
    (await routeAgentRequest(c.req.raw, c.env)) ||
    c.json({ error: "Agent not found" }, 404)
  );
});

// IMPORTANT: Must be BEFORE the React Router catch-all
app.get("*", (c) => { /* React Router handler */ });
```

### Agent Handler

```typescript
import { Agent } from "agents";

export class ResearchAgent extends Agent<Env> {
  async onRequest(request: Request) {
    const { prompt } = await request.json<{ prompt: string }>();
    
    const vercelAgent = this.createVercelAgent();
    const result = vercelAgent.stream({ prompt });
    
    return result.toTextStreamResponse();
  }
}
```

**Trade-offs:**
- ✅ Simplest setup, zero configuration
- ✅ Fast prototyping
- ❌ No middleware layer (auth, validation)
- ❌ Direct endpoint exposure

---

## Pattern 2: HTTP with Middleware

Route through custom Hono endpoints for full middleware control.

### Frontend Implementation

```typescript
import { useCompletion } from "@ai-sdk/react";

const { completion, complete, isLoading } = useCompletion({
  api: "/api/research", // Custom Hono route
  streamProtocol: "text",
});

const handleSubmit = async () => {
  await complete("", {
    body: {
      prompt: "Plan a trip to Paris",
      userId: "user-123",
    },
  });
};
```

### Backend (Hono Route)

```typescript
import { getAgentByName } from "agents";

app.post("/api/research", async (c) => {
  // Add middleware: auth, validation, rate limiting, logging
  const { prompt, userId } = await c.req.json<{
    prompt: string;
    userId?: string;
  }>();

  // Get or create agent instance for this user
  const agentId = userId || "default";
  const agent = await getAgentByName<Env, ResearchAgent>(
    c.env.ResearchAgent,
    agentId
  );

  // Forward request to agent's onRequest handler
  const agentRequest = new Request(c.req.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  // agent.fetch() triggers onRequest() and returns streaming Response
  return agent.fetch(agentRequest);
});
```

**Use cases:**
- Authentication and authorization
- Request validation
- Rate limiting
- Custom response formatting
- Logging and analytics

---

## Pattern 3: Custom RPC Methods

Call custom methods on the agent directly instead of using `onRequest()`.

### Frontend Implementation

```typescript
const { completion, complete, isLoading } = useCompletion({
  api: "/api/research/initiate", // RPC endpoint
  streamProtocol: "text",
});

await complete("", {
  body: { prompt: "Search for flights", userId: "user-123" },
});
```

### Backend (Hono Route)

```typescript
app.post("/api/research/initiate", async (c) => {
  const { prompt, userId } = await c.req.json<{
    prompt: string;
    userId?: string;
  }>();

  const agent = await getAgentByName<Env, ResearchAgent>(
    c.env.ResearchAgent,
    userId || "default"
  );

  // Call custom RPC method directly (requires type casting)
  return (agent as any).initiateAgent(prompt);
});
```

### Agent Implementation

```typescript
export class ResearchAgent extends Agent<Env> {
  /**
   * Custom RPC Method
   * 
   * IMPORTANT: Must return Response, not StreamTextResult!
   * Durable Objects can only pass serializable data across boundaries.
   */
  initiateAgent(prompt: string): Response {
    const vercelAgent = this.createVercelAgent();
    const result = vercelAgent.stream({ prompt });
    
    // Convert to Response INSIDE the Durable Object
    return result.toTextStreamResponse();
  }

  // You can have multiple custom methods
  searchFlights(destination: string): Response { /* ... */ }
  bookHotel(hotelId: string): Response { /* ... */ }
  getItinerary(): Response { /* ... */ }
}
```

**Benefits:**
- Multiple entry points per agent
- Cleaner method signatures (no Request parsing)
- Type safety on parameters

---

## Pattern 4: WebSocket Streaming

Real-time bidirectional communication via persistent WebSocket connection.

### Frontend Implementation

```typescript
import { useState } from "react";
import { useAgent } from "agents/react";

export default function WebSocketPage() {
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 8));
  const [response, setResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // useAgent establishes WebSocket to /agents/:agent/:name
  const connection = useAgent({
    agent: "research-agent", // kebab-case class name
    name: sessionId,
    
    onMessage: (message) => {
      try {
        const data = JSON.parse(message.data);
        
        if (data.type === "chunk") {
          setResponse((prev) => prev + data.content);
        } else if (data.type === "complete") {
          setIsStreaming(false);
        } else if (data.type === "error") {
          console.error(data.message);
          setIsStreaming(false);
        }
      } catch {
        // Handle non-JSON messages
        setResponse((prev) => prev + message.data);
      }
    },
    
    onOpen: () => console.log("WebSocket connected"),
    onClose: () => setIsStreaming(false),
    onError: (err) => console.error("WebSocket error:", err),
  });

  const handleSubmit = () => {
    setResponse("");
    setIsStreaming(true);
    
    // Send message via WebSocket (triggers onMessage handler)
    connection.send(JSON.stringify({ prompt: "Plan a trip to Tokyo" }));
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={isStreaming}>Send</button>
      <div>{response}</div>
    </div>
  );
}
```

### Agent Handler

```typescript
import { Agent } from "agents";
import type { Connection } from "agents";

export class ResearchAgent extends Agent<Env> {
  async onMessage(connection: Connection, message: string) {
    try {
      const { prompt } = JSON.parse(message) as { prompt: string };

      const vercelAgent = this.createVercelAgent();
      const result = vercelAgent.stream({ prompt });

      // Stream chunks back through WebSocket
      for await (const chunk of result.textStream) {
        connection.send(JSON.stringify({
          type: "chunk",
          content: chunk,
        }));
      }

      // Signal completion
      connection.send(JSON.stringify({ type: "complete" }));
    } catch (error) {
      connection.send(JSON.stringify({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }
}
```

**Use cases:**
- Real-time chat applications
- Live collaboration
- Streaming updates
- Push notifications from agent

### WebSocket + TanStack Query Integration

Combine WebSocket agents with TanStack Query for cache invalidation when agents push updates:

```typescript
import { useAgent } from "agents/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

function RealtimeDashboard() {
  const queryClient = useQueryClient();

  // WebSocket connection for real-time events
  const connection = useAgent({
    agent: "support-agent",
    name: sessionId,
    onMessage: (message) => {
      const event = JSON.parse(message.data);

      // Invalidate queries when agent pushes data updates
      if (event.type === "data-updated") {
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
      if (event.type === "ticket-resolved") {
        queryClient.invalidateQueries({ queryKey: ["tickets"] });
      }
    },
  });

  // Cached query with background refresh
  const { data, isFetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    staleTime: 30 * 1000, // Fresh for 30 seconds
  });

  return (
    <div>
      {isFetching && <RefreshIndicator />}
      <Dashboard data={data} connected={connection?.readyState === 1} />
    </div>
  );
}
```

**Benefits of this pattern:**
- Real-time updates via WebSocket push events
- Automatic caching and deduplication via TanStack Query
- Users see cached data instantly while fresh data loads in background
- Agent can trigger selective cache invalidation for specific data

---

## Pattern 5: Generative UI (Tool-Based)

Use LLM tools to render dynamic React components.

### Frontend Implementation

```typescript
import { useChat, DefaultChatTransport } from "@ai-sdk/react";

function GenerativeUIChat() {
  const [inputValue, setInputValue] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/generative-ui/chat",
    }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage({ text: inputValue });
    setInputValue("");
  };

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          {message.parts?.map((part, index) => {
            if (part.type === "text") {
              return <p key={index}>{part.text}</p>;
            }
            
            // Render UI components for tool results
            if (part.type.startsWith("tool-")) {
              const toolName = part.type.replace("tool-", "");
              
              if (toolName === "displayWeather" && part.state === "output-available") {
                return <WeatherCard key={index} weather={part.output} />;
              }
              if (toolName === "getStockPrice" && part.state === "output-available") {
                return <StockCard key={index} stock={part.output} />;
              }
            }
            return null;
          })}
        </div>
      ))}
      
      <form onSubmit={handleSubmit}>
        <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

### Backend Implementation

```typescript
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";

app.post("/api/generative-ui/chat", async (c) => {
  const { messages } = await c.req.json<{ messages: UIMessage[] }>();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: "You are a helpful assistant. Use tools when appropriate.",
    messages: convertToModelMessages(messages),
    tools: {
      displayWeather: tool({
        description: "Display weather for a city",
        parameters: z.object({ city: z.string() }),
        execute: async ({ city }) => {
          // Fetch weather data
          return { city, temperature: 72, condition: "Sunny" };
        },
      }),
      getStockPrice: tool({
        description: "Get stock price",
        parameters: z.object({ symbol: z.string() }),
        execute: async ({ symbol }) => {
          return { symbol, price: 150.25, change: 2.5 };
        },
      }),
    },
    stopWhen: stepCountIs(5),
  });

  // Use toUIMessageStreamResponse for useChat hook compatibility
  return result.toUIMessageStreamResponse();
});
```

---

## Pattern 6: Object Streaming

Stream typed, structured objects with progressive updates.

### Frontend Implementation

```typescript
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { z } from "zod";

const recipeSchema = z.object({
  recipe: z.object({
    name: z.string(),
    ingredients: z.array(z.object({
      item: z.string(),
      amount: z.string(),
    })),
    steps: z.array(z.string()),
  }),
});

function RecipeGenerator() {
  const { object, submit, isLoading, stop } = useObject({
    api: "/api/stream-object/recipe",
    schema: recipeSchema,
  });

  return (
    <div>
      <button onClick={() => submit({ cuisine: "Italian" })} disabled={isLoading}>
        Generate Recipe
      </button>
      
      {/* UI updates progressively as object streams */}
      {object?.recipe?.name && <h2>{object.recipe.name}</h2>}
      {object?.recipe?.ingredients?.map((ing, i) => (
        <li key={i}>{ing.amount} {ing.item}</li>
      ))}
    </div>
  );
}
```

### Backend Implementation

```typescript
import { streamObject } from "ai";

app.post("/api/stream-object/recipe", async (c) => {
  const { cuisine } = await c.req.json<{ cuisine?: string }>();

  const result = streamObject({
    model: openai("gpt-4o-mini"),
    schema: recipeSchema,
    prompt: `Generate a ${cuisine || "Italian"} recipe.`,
  });

  return result.toTextStreamResponse();
});
```

---

## Wrangler Configuration

### wrangler.jsonc

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-agent-app",
  "compatibility_date": "2025-01-08",
  "compatibility_flags": ["nodejs_compat"], // Required for AI SDK
  "main": "./workers/app.ts",

  // Durable Object bindings
  "durable_objects": {
    "bindings": [
      {
        "name": "ResearchAgent", // env.ResearchAgent
        "class_name": "ResearchAgent"
      },
      {
        "name": "SupportAgent",
        "class_name": "SupportAgent"
      }
    ]
  },

  // Migrations - required for SQLite-backed agents
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["ResearchAgent", "SupportAgent"]
    }
  ]
}
```

### Adding a New Agent

1. Create the agent class in `workers/agents/`
2. Export it from `workers/app.ts`
3. Add binding to `durable_objects.bindings`
4. Add migration with incremented tag

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
    { "tag": "v2", "new_sqlite_classes": ["NewAgent"] }
  ]
}
```

---

## Agent Class Template

```typescript
import { Agent } from "agents";
import type { Connection } from "agents";
import {
  stepCountIs,
  Experimental_Agent as VercelAgent,
  type ToolSet,
} from "ai";
import { openai } from "@ai-sdk/openai";

export class MyAgent extends Agent<Env> {
  private createVercelAgent() {
    return new VercelAgent({
      model: openai("gpt-4o"),
      system: "You are a helpful assistant.",
      tools: this.getTools(),
      stopWhen: stepCountIs(5),
    });
  }

  private getTools(): ToolSet {
    return {
      // Define your tools here
    };
  }

  // HTTP handler (Pattern 1, 2)
  async onRequest(request: Request) {
    const { prompt } = await request.json<{ prompt: string }>();
    const vercelAgent = this.createVercelAgent();
    const result = vercelAgent.stream({ prompt });
    return result.toTextStreamResponse();
  }

  // WebSocket handler (Pattern 4)
  async onMessage(connection: Connection, message: string) {
    try {
      const { prompt } = JSON.parse(message);
      const vercelAgent = this.createVercelAgent();
      const result = vercelAgent.stream({ prompt });

      for await (const chunk of result.textStream) {
        connection.send(JSON.stringify({ type: "chunk", content: chunk }));
      }
      connection.send(JSON.stringify({ type: "complete" }));
    } catch (error) {
      connection.send(JSON.stringify({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }

  // Custom RPC method (Pattern 3)
  customAction(params: string): Response {
    const vercelAgent = this.createVercelAgent();
    const result = vercelAgent.stream({ prompt: params });
    return result.toTextStreamResponse(); // Must return Response
  }
}
```

---

## Common Errors & Solutions

### Error: "Failed to parse stream string"

**Cause:** `useCompletion` expects data stream protocol, but agent returns plain text.

**Solution:**
```typescript
const { completion } = useCompletion({
  api: "/api/research",
  streamProtocol: "text", // Add this!
});
```

### Error: "DataCloneError: Could not serialize object"

**Cause:** Returning non-serializable object from Durable Object RPC method.

**Solution:** Return `Response` instead of `StreamTextResult`:
```typescript
// ❌ WRONG
customMethod(prompt: string) {
  return vercelAgent.stream({ prompt }); // DataCloneError!
}

// ✅ CORRECT
customMethod(prompt: string): Response {
  return vercelAgent.stream({ prompt }).toTextStreamResponse();
}
```

### Error: WebSocket 404 or "No routes matched"

**Cause:** Agent route defined after React Router catch-all, or wrong URL pattern.

**Solution:**
```typescript
// Define /agents/* BEFORE catch-all
app.all("/agents/*", ...);  // First
app.get("*", ...);          // Last
```

### Error: "Agent not found"

**Cause:** Agent class not exported or binding not configured.

**Solution:**
1. Export class from `workers/app.ts`:
   ```typescript
   export { ResearchAgent };
   ```
2. Add binding in `wrangler.jsonc`

---

## Best Practices

1. **User-Specific Agent Instances**
   ```typescript
   // Good - user isolation
   const agent = await getAgentByName(env.Agent, userId);
   
   // Bad - shared state
   const agent = await getAgentByName(env.Agent, "default");
   ```

2. **Always Wrap Agent Operations in try-catch**
   ```typescript
   async onMessage(connection: Connection, message: string) {
     try {
       // ... agent logic
     } catch (error) {
       connection.send(JSON.stringify({ type: "error", message: error.message }));
     }
   }
   ```

3. **Limit Reasoning Steps**
   ```typescript
   new VercelAgent({
     stopWhen: stepCountIs(5), // Prevent infinite loops
   });
   ```

4. **Route Order Matters**
   ```typescript
   app.all("/agents/*", ...);     // Agent routes first
   app.post("/api/research", ...); // Custom API routes
   app.get("*", ...);              // React Router catch-all LAST
   ```

5. **Generate and Use Cloudflare Types**
   ```bash
   pnpm run cf-typegen
   ```

6. **Use TanStack Query for Non-Streaming Data**

   Use TanStack Query for cacheable data, and combine with WebSocket for real-time updates:
   ```typescript
   // WebSocket for events, TanStack Query for cached data
   const connection = useAgent({
     agent: "support-agent",
     onMessage: (msg) => {
       if (msg.type === "update") {
         queryClient.invalidateQueries({ queryKey: ["data"] });
       }
     },
   });

   const { data } = useQuery({
     queryKey: ["data"],
     queryFn: fetchData,
     staleTime: 30_000, // Cache for 30 seconds
   });
   ```

---

## Dependencies

```json
{
  "dependencies": {
    "agents": "^0.2.23",
    "ai": "^5.0.102",
    "@ai-sdk/openai": "^2.0.73",
    "@ai-sdk/react": "^1.2.12",
    "@tanstack/react-query": "^5.x",
    "hono": "4.8.2",
    "zod": "^4.1.13"
  },
  "devDependencies": {
    "@tanstack/react-query-devtools": "^5.x"
  }
}
```

> **Note:** TanStack Query is optional but recommended for caching and the WebSocket + Query integration pattern.

## Environment Variables

Create `.dev.vars` for local development:
```
OPENAI_API_KEY=sk-your-key-here
```

For production, set secrets via Wrangler:
```bash
wrangler secret put OPENAI_API_KEY
```
