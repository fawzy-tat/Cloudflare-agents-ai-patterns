# Hono + Cloudflare Agents Integration - Best Practices

## Architecture Overview

When using Hono with Agents in a fullstack Worker, you have one entry point handling:

- API routes (Hono)
- Agent connections (Agents SDK)
- Frontend serving (React Router)

## Three Integration Patterns

### 1. Direct Agent Routing (Simplest)

```typescript
app.all("/api/agents/*", async (c) => {
  return (
    (await routeAgentRequest(c.req.raw, c.env)) ||
    c.json({ error: "Not found" }, 404)
  );
});
```

**Use when:** Connecting React apps directly to agents with minimal preprocessing

### 2. Manual Agent Invocation (Most Common)

```typescript
app.post("/api/research", async (c) => {
  const agent = await getAgentByName<Env, ResearchAgent>(
    c.env.ResearchAgent,
    userId
  );
  const response = await agent.fetch(agentRequest);
  return c.json({ result: await response.text() });
});
```

**Use when:** You need authentication, request preprocessing, or custom response formatting

### 3. Conditional Routing (Advanced)

Route to different agents based on business logic (user role, intent detection, etc.)

## Best Practices

✅ **DO:**

- Add authentication middleware before agent routes
- Use unique agent names per user/session for state isolation
- Handle agent errors gracefully with try-catch
- Keep agent logic in Agent classes, API logic in Hono routes

❌ **DON'T:**

- Mix agent business logic with Hono routing logic
- Bypass authentication when calling agents from APIs
- Create new agent instances unnecessarily (they persist automatically)

## wrangler.jsonc Configuration

```json
{
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["ResearchAgent", "SupportAgent"]
    }
  ]
}
```

## When to Use API Endpoints vs Direct Agent Routing

- **API endpoints:** Authentication, preprocessing, business logic, multiple agent orchestration
- **Direct routing:** Simple React-to-Agent connections, WebSocket chat interfaces
