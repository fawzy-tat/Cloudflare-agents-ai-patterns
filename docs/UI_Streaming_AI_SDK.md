# Vercel AI SDK - useCompletion Hook Quick Reference (Form Streaming)

## When to Use

- **Form submissions** with streaming AI responses (not chat)
- Single prompt → streaming output (no conversation history)
- Simpler alternative to `useChat` when you don't need multi-turn conversations

## Key Concepts

- `useCompletion` - React hook for single-prompt completions
- `streamText` - Server-side function that streams AI responses
- `toTextStreamResponse()` - Converts stream to HTTP response

## Backend Implementation

```typescript
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/generate" && request.method === "POST") {
      const { topic, tone, length } = await request.json();

      const result = streamText({
        model: openai("gpt-4o"),
        prompt: `Write a ${length} ${tone} article about ${topic}`,
      });

      // Stream response directly to client
      return result.toTextStreamResponse();
    }

    return new Response("Not found", { status: 404 });
  },
};
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

## useCompletion Hook Returns

| Property     | Type            | Description                      |
| ------------ | --------------- | -------------------------------- |
| `completion` | `string`        | The streaming text output        |
| `complete`   | `function`      | Trigger the completion request   |
| `isLoading`  | `boolean`       | Whether a request is in progress |
| `error`      | `Error \| null` | Any error that occurred          |
| `stop`       | `function`      | Abort the current request        |

## Response Format Options

```typescript
// Plain text stream (simplest)
return result.toTextStreamResponse();

// Data stream with metadata (usage stats, finish reason)
return result.toDataStreamResponse();
```

## Chat vs Completion Comparison

| Chat (`useChat`)                | Completion (`useCompletion`) |
| ------------------------------- | ---------------------------- |
| Multi-turn conversations        | Single prompt/response       |
| Maintains message history       | No history                   |
| Uses `AIChatAgent`              | Plain worker route           |
| `createUIMessageStreamResponse` | `toTextStreamResponse()`     |

**Use `useCompletion` for forms, `useChat` for conversations.**
