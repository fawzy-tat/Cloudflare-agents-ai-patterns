# createUIMessageStreamResponse - Quick Reference

## What It Does

Creates a Response object that streams **structured UI messages** to the client, enabling rich interactive chat interfaces beyond plain text.

## When to Use

| Use Case                    | Hook            | Response Method                   |
| --------------------------- | --------------- | --------------------------------- |
| Simple text completion      | `useCompletion` | `toTextStreamResponse()`          |
| **Rich chat with metadata** | `useChat`       | `createUIMessageStreamResponse()` |
| WebSocket real-time         | `useAgent`      | WebSocket messages                |

## Basic Example

```typescript
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from "ai";

app.post("/api/chat", async (c) => {
  const { messages } = await c.req.json();

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute({ writer }) {
        // Stream text content
        writer.write({ type: "text", value: "Searching for flights..." });

        // Stream custom data (UI can render progress indicators)
        writer.write({ type: "data", value: { status: "searching" } });

        // Merge with LLM stream
        const result = streamText({ model: openai("gpt-4o"), messages });
        writer.merge(result.toUIMessageStream());
      },
    }),
  });
});
```

## Message Types

```typescript
// Plain text
writer.write({ type: "text", value: "Hello, world!" });

// Custom data (JSON - render cards, progress, etc.)
writer.write({
  type: "data",
  value: { flightPrice: 350, airline: "CloudAir" },
});

// Source citations
writer.write({
  type: "source-url",
  value: { id: "src-1", url: "https://example.com", title: "Source" },
});
```

## Good Use Cases

✅ **Use when you need:**

- Source citations in chat responses
- Real-time tool execution status/progress
- Streaming custom UI components (cards, charts)
- Multi-step agent workflows with visual feedback

❌ **Don't use for:**

- Simple text completions → use `toTextStreamResponse()` + `useCompletion`
- WebSocket agents → use `useAgent` hook
- When you don't need structured metadata

## Comparison: Our Demo Approaches

| Page               | Transport | Hook            | Response                          |
| ------------------ | --------- | --------------- | --------------------------------- |
| Direct Agent       | WebSocket | `useAgent`      | `connection.send()` chunks        |
| HTTP Streaming     | HTTP      | `useCompletion` | `toTextStreamResponse()`          |
| Rich Chat (future) | HTTP      | `useChat`       | `createUIMessageStreamResponse()` |

## References

- [AI SDK Docs](https://ai-sdk.dev/docs/reference/ai-sdk-ui/create-ui-message-stream-response)
