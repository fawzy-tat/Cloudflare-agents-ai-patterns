# Cloudflare Agents + Vercel AI SDK Integration

## Overview

Vercel AI SDK works hand-in-hand with Cloudflare Agent SDK. Think of Vercel AI as the **brain** and Cloudflare Agent as the **container**.

| Component            | Responsibility                                                    |
| -------------------- | ----------------------------------------------------------------- |
| **Cloudflare Agent** | Lifecycle, state, WebSockets, scheduling, Durable Object per user |
| **Vercel AI Agent**  | Given a prompt + history, decide how to use tools & models        |

## Integration Pattern

### Inside Your Cloudflare Agent Class

```typescript
import { Agent } from "agents";
import { Experimental_Agent as VercelAgent, tool } from "ai";
import { z } from "zod";

export class MyAgent extends Agent<Env> {
  private vercelAgent = new VercelAgent({
    model: openai("gpt-4o"),
    system: "You are a helpful assistant.",
    tools: {
      saveNote: tool({
        description: "Persist a note for this user",
        inputSchema: z.object({ text: z.string() }),
        execute: async ({ text }) => {
          // Access Cloudflare Agent state via closure
          await this.sql.exec("INSERT INTO notes (text) VALUES (?)", [text]);
          return { ok: true };
        },
      }),
    },
    stopWhen: stepCountIs(10),
  });

  async onMessage(conn, message) {
    const { prompt } = JSON.parse(message);

    const result = await this.vercelAgent.stream({ prompt });

    // Stream back through WebSocket
    for await (const chunk of result.textStream) {
      conn.send(JSON.stringify({ type: "chunk", content: chunk }));
    }
  }
}
```

## UI Integration Options

### Option 1: Cloudflare Native (WebSocket + useAgent)

✅ **Use when:** You want real-time, reconnectable behavior with state sync

```typescript
// Frontend
import { useAgent } from "agents/react";

const connection = useAgent({
  agent: "my-agent",
  name: userId,
  onMessage: (msg) => console.log(msg.data),
});

connection.send(JSON.stringify({ prompt: "Hello" }));
```

**Flow:**

1. UI uses Cloudflare's `useAgent` and WebSockets
2. Messages forwarded to Vercel AI Agent inside the Durable Object
3. Vercel Agent streams responses back via WebSocket

**Pros:**

- ✓ Real-time bidirectional communication
- ✓ Built-in reconnection handling
- ✓ State synchronization via `setState`

---

### Option 2: Vercel Style (HTTP + useCompletion/useChat)

✅ **Use when:** You want to use Vercel AI SDK's HTTP streaming hooks

```typescript
// Backend: Expose HTTP route
app.post("/api/chat", async (c) => {
  const agent = await getAgentByName(c.env.MyAgent, userId);
  const result = await agent.fetch(request);
  return result; // Returns toTextStreamResponse()
});

// Frontend
import { useCompletion } from "@ai-sdk/react";

const { completion, complete } = useCompletion({
  api: "/api/chat",
  streamProtocol: "text",
});
```

**Flow:**

1. HTTP route talks to Durable Object
2. Durable Object calls Vercel AI Agent
3. Returns `result.toTextStreamResponse()`
4. Frontend uses `useCompletion`/`useChat`

**Pros:**

- ✓ Works with existing REST infrastructure
- ✓ Compatible with Vercel AI SDK patterns
- ✓ Simpler stateless model

---

## Comparison Table

| Feature            | useAgent (WebSocket)        | useCompletion/useChat (HTTP) |
| ------------------ | --------------------------- | ---------------------------- |
| **Transport**      | WebSocket                   | HTTP Streaming               |
| **State Sync**     | ✓ Built-in                  | ✗ Manual                     |
| **Reconnection**   | ✓ Automatic                 | ✗ Manual retry               |
| **Tool Execution** | Real-time updates           | Streamed in final response   |
| **Complexity**     | More plumbing               | Simpler                      |
| **Best For**       | Interactive chat with state | Simple completions           |

## Best Practices

✅ **DO:**

- Use Vercel Agent for AI logic (model selection, tool usage, prompting)
- Use Cloudflare Agent for state, persistence, and lifecycle management
- Pick ONE UI pattern (WebSocket OR HTTP) and stick with it
- Access Cloudflare Agent state in tool `execute` functions via closure

❌ **DON'T:**

- Mix both UI patterns in the same interface
- Replicate state logic between Vercel and Cloudflare Agents
- Bypass Cloudflare Agent's state management APIs

## References

- [Cloudflare Agents SDK](https://www.npmjs.com/package/agents)
- [Vercel AI SDK Agents](https://ai-sdk.dev/docs/agents/building-agents)
