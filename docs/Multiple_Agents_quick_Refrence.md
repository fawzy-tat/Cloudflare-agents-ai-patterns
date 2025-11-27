# Cloudflare Agents SDK - Multiple Agents Quick Reference ( Directly form worker WITHOUT HONO )

## Automatic URL-Based Routing

`routeAgentRequest()` automatically routes to agents based on URL pattern: `/agents/:agent/:name`

## Agent Class to URL Mapping

- Class names convert to kebab-case for URLs
- `ParsingAgent` → `/agents/parsing-agent/:name`
- `CraftingAgent` → `/agents/crafting-agent/:name`
- `:name` = unique instance identifier (user ID, session ID, etc.)

## Implementation Pattern

```typescript
// 1. Export multiple agent classes extending AIChatAgent
export class ParsingAgent extends AIChatAgent<Env> {
  /* ... */
}
export class CraftingAgent extends AIChatAgent<Env> {
  /* ... */
}

// 2. Use single routeAgentRequest in worker
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
};
```

**That's it!** No manual routing logic needed—export your agents and the SDK handles the rest.
