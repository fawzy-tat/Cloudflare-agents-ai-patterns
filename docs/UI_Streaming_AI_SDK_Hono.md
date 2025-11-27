# Vercel AI SDK - useCompletion with Hono Quick Reference

## When to Use

- **Form submissions** with streaming AI responses via Hono API routes
- When you need Hono middleware (auth, validation, logging) before AI calls
- Integrating AI streaming into an existing Hono + React Router stack

## Key Concepts

- Hono routes can return `Response` objects directly (including streams)
- `streamText` works the same as in plain workers
- `toTextStreamResponse()` returns a standard `Response` that Hono passes through

## Backend Implementation (Hono)

```typescript
// workers/app.ts
import { Hono } from "hono";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

const app = new Hono<{ Bindings: Env }>();

// Streaming completion endpoint
app.post("/api/generate", async (c) => {
  const { topic, tone, length } = await c.req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    prompt: `Write a ${length} ${tone} article about ${topic}`,
  });

  // Return streaming response directly through Hono
  return result.toTextStreamResponse();
});

export default app;
```

## With Hono Middleware

```typescript
import { Hono } from "hono";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { bearerAuth } from "hono/bearer-auth";

const app = new Hono<{ Bindings: Env }>();

// Add auth middleware before AI routes
app.use("/api/*", bearerAuth({ token: "secret-token" }));

app.post("/api/generate", async (c) => {
  const { prompt } = await c.req.json();

  // Access env bindings if needed
  const model = openai("gpt-4o", {
    apiKey: c.env.OPENAI_API_KEY,
  });

  const result = streamText({
    model,
    prompt,
  });

  return result.toTextStreamResponse();
});

export default app;
```

## Frontend Implementation

```tsx
import { useCompletion } from "@ai-sdk/react";

function ArticleGenerator() {
  const { completion, complete, isLoading } = useCompletion({
    api: "/api/generate",
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    complete("", {
      body: {
        topic: formData.get("topic"),
        tone: formData.get("tone"),
        length: formData.get("length"),
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="topic" placeholder="Topic" />
      <select name="tone">
        <option value="professional">Professional</option>
        <option value="casual">Casual</option>
      </select>
      <button type="submit" disabled={isLoading}>
        Generate
      </button>

      {/* Streaming output renders here */}
      <div>{completion}</div>
    </form>
  );
}
```

## Plain Worker vs Hono Comparison

| Plain Worker                           | Hono                                   |
| -------------------------------------- | -------------------------------------- |
| `if (url.pathname === "/api/...")`     | `app.post("/api/...", handler)`        |
| `await request.json()`                 | `await c.req.json()`                   |
| `return result.toTextStreamResponse()` | `return result.toTextStreamResponse()` |
| Manual middleware                      | Built-in middleware support            |

## Response Patterns in Hono

```typescript
// ✅ Return Response directly (streaming works)
app.post("/api/stream", async (c) => {
  const result = streamText({ model, prompt });
  return result.toTextStreamResponse();
});

// ✅ With custom headers
app.post("/api/stream", async (c) => {
  const result = streamText({ model, prompt });
  const response = result.toTextStreamResponse();
  response.headers.set("X-Custom-Header", "value");
  return response;
});

// ❌ Don't use c.json() for streams
app.post("/api/stream", async (c) => {
  const result = streamText({ model, prompt });
  return c.json(result); // Won't stream!
});
```

## Integration with Agents

Combine Hono streaming with Agent state when needed:

```typescript
import { getAgentByName } from "agents";

app.post("/api/research", async (c) => {
  const { userId, query } = await c.req.json();

  // Get or create agent for this user
  const agent = await getAgentByName<Env, ResearchAgent>(
    c.env.ResearchAgent,
    userId
  );

  // Use streamText with agent context
  const result = streamText({
    model: openai("gpt-4o"),
    system: `You are a research assistant. User context: ${await agent.getContext()}`,
    prompt: query,
  });

  return result.toTextStreamResponse();
});
```

**Key insight:** Hono passes `Response` objects through unchanged—streaming just works!
