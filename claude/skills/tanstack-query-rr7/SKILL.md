---
name: TanStack Query for React Router 7
description: Implement TanStack Query (React Query) for server state management in React Router 7 applications with Cloudflare Workers, Hono, and Vercel AI SDK
version: 1.0.0
tags:
  - tanstack-query
  - react-query
  - react-router-7
  - cloudflare-workers
  - hono
  - caching
  - server-state
---

# TanStack Query for React Router 7

This skill provides comprehensive guidance for implementing TanStack Query (formerly React Query) in React Router 7 applications, particularly those using Cloudflare Workers and Hono backends.

## When to Use This Skill

Use TanStack Query when the application needs:
- **Server state management** - Data that lives on the server and needs to be fetched/cached
- **Automatic caching** - Avoid redundant network requests
- **Loading/error states** - Consistent UI feedback patterns
- **Mutations with optimistic updates** - Instant UI feedback with rollback on failure
- **Real-time + caching hybrid** - Combine WebSocket data with cached queries
- **Request deduplication** - Multiple components sharing the same data

## Why TanStack Query Over React Router Loaders

React Router 7 provides `loader` functions, but TanStack Query offers additional benefits:

| Feature | React Router Loaders | TanStack Query |
|---------|---------------------|----------------|
| Route-based fetching | ✅ Built-in | ❌ Manual |
| Client-side caching | ❌ None | ✅ Automatic |
| Background refetching | ❌ None | ✅ staleTime/refetchInterval |
| Optimistic updates | ❌ Manual | ✅ Built-in |
| Request deduplication | ❌ None | ✅ Automatic |
| Mutation handling | ❌ Actions only | ✅ useMutation |
| DevTools | ❌ None | ✅ React Query DevTools |

**Recommendation**: Use both together:
- React Router loaders for initial page data (SSR-friendly)
- TanStack Query for dynamic/interactive data after hydration

## Installation

```bash
pnpm add @tanstack/react-query
# Optional but recommended for development:
pnpm add -D @tanstack/react-query-devtools
```

## Setup

### 1. Create Query Provider

Create `app/providers/query-provider.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is fresh for 1 minute before becoming "stale"
            staleTime: 60 * 1000,
            // Keep unused data in cache for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Retry failed requests 3 times with exponential backoff
            retry: 3,
            // Refetch when window regains focus
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 2. Wrap App with Provider

In `app/root.tsx`:

```typescript
import { QueryProvider } from "~/providers/query-provider";

export default function App() {
  return (
    <QueryProvider>
      <Outlet />
    </QueryProvider>
  );
}
```

## Core Concepts

### Stale-While-Revalidate Pattern

TanStack Query uses "stale-while-revalidate" caching:

1. **Fresh** (0 to staleTime): Data is served from cache, no refetch
2. **Stale** (after staleTime): Data is served from cache BUT refetch happens in background
3. **Garbage collected** (after gcTime): Data is removed from cache

**Real-life example**: A news feed showing articles. Users see cached articles instantly, while fresh articles load in the background. No loading spinner, instant experience.

### Cache Location

The cache is stored **in-memory in the browser** (not localStorage or sessionStorage). This means:
- Cache clears on page refresh
- Each browser tab has its own cache
- Fast access, no serialization overhead

### Retry vs Polling

**Retry** (automatic):
- Happens when a request FAILS
- Default: 3 retries with exponential backoff (1s, 2s, 4s)
- Stops after success or max retries

**Polling** (manual via refetchInterval):
- Happens at regular intervals regardless of success
- Useful for real-time data without WebSockets
- Example: `refetchInterval: 5000` fetches every 5 seconds

## Common Patterns

### Basic useQuery

```typescript
import { useQuery } from "@tanstack/react-query";

function HealthStatus() {
  const { data, isLoading, error, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 30 * 1000, // Fresh for 30 seconds
    refetchInterval: 60 * 1000, // Poll every minute
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <p>Status: {data.status}</p>
      {isFetching && <span>Refreshing...</span>}
      <small>Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}</small>
    </div>
  );
}
```

### Parameterized Queries

```typescript
function Stats({ type }: { type: "users" | "requests" | "agents" }) {
  const { data, isLoading } = useQuery({
    // Include parameters in queryKey for proper caching
    queryKey: ["stats", type],
    queryFn: async () => {
      const res = await fetch(`/api/stats/${type}`);
      return res.json();
    },
  });

  // Each type has its own cache entry
  return <StatsCard data={data} loading={isLoading} />;
}
```

### Mutations with Optimistic Updates

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

function TodoList() {
  const queryClient = useQueryClient();

  const addTodo = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Failed to add");
      return res.json();
    },
    // Optimistic update - update UI immediately
    onMutate: async (text) => {
      // Cancel in-flight queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["todos"] });

      // Snapshot current data for rollback
      const previous = queryClient.getQueryData(["todos"]);

      // Optimistically add the new todo
      queryClient.setQueryData(["todos"], (old: any) => ({
        ...old,
        items: [
          { id: `temp-${Date.now()}`, text, status: "pending" },
          ...(old?.items || []),
        ],
      }));

      return { previous };
    },
    // Rollback on error
    onError: (_err, _text, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["todos"], context.previous);
      }
    },
    // Refetch to ensure server state after mutation
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const text = e.target.text.value;
      addTodo.mutate(text);
    }}>
      <input name="text" />
      <button disabled={addTodo.isPending}>
        {addTodo.isPending ? "Adding..." : "Add"}
      </button>
    </form>
  );
}
```

### Request Deduplication

Multiple components using the same queryKey share a single request:

```typescript
// Component A
function HeaderUserCount() {
  const { data } = useQuery({
    queryKey: ["stats", "users"],
    queryFn: fetchUserStats,
  });
  return <span>{data?.total} users</span>;
}

// Component B - same queryKey, NO duplicate request!
function DashboardUserStats() {
  const { data } = useQuery({
    queryKey: ["stats", "users"],
    queryFn: fetchUserStats,
  });
  return <UserStatsChart data={data} />;
}
```

### WebSocket + Query Integration

Combine Cloudflare Agents (WebSocket) with TanStack Query:

```typescript
import { useAgent } from "agents/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

function RealtimeDashboard() {
  const queryClient = useQueryClient();

  // WebSocket connection for real-time events
  const agent = useAgent({
    agent: "support-agent",
    onMessage: (message) => {
      const event = JSON.parse(message.data);

      // Invalidate relevant queries when server pushes updates
      if (event.type === "data-updated") {
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
    },
  });

  // Cached query with background refresh
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    staleTime: 30 * 1000,
  });

  return <Dashboard data={data} connected={agent.readyState === 1} />;
}
```

## Backend API Patterns (Hono)

Create API endpoints that work well with TanStack Query:

```typescript
import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

// GET endpoint for useQuery
app.get("/api/items", async (c) => {
  // Add artificial delay for demo loading states
  await new Promise((r) => setTimeout(r, 500));

  const items = await getItems(c.env);
  return c.json({ items, total: items.length });
});

// POST endpoint for useMutation (create)
app.post("/api/items", async (c) => {
  const { text } = await c.req.json<{ text: string }>();

  if (!text?.trim()) {
    return c.json({ error: "Text is required" }, 400);
  }

  const newItem = await createItem(c.env, text);
  return c.json(newItem, 201);
});

// PATCH endpoint for useMutation (update)
app.patch("/api/items/:id", async (c) => {
  const id = c.req.param("id");
  const updates = await c.req.json();

  const item = await updateItem(c.env, id, updates);
  if (!item) {
    return c.json({ error: "Item not found" }, 404);
  }

  return c.json(item);
});

// DELETE endpoint for useMutation (delete)
app.delete("/api/items/:id", async (c) => {
  const id = c.req.param("id");

  const deleted = await deleteItem(c.env, id);
  if (!deleted) {
    return c.json({ error: "Item not found" }, 404);
  }

  return c.json({ success: true, id });
});
```

## Best Practices

### 1. Query Key Structure

Use consistent, hierarchical query keys:

```typescript
// Good - hierarchical and predictable
["users"]                    // All users
["users", userId]            // Single user
["users", userId, "posts"]   // User's posts
["posts", { status, page }]  // Filtered/paginated posts

// Bad - inconsistent
["user-data"]
["fetchUsers"]
[userId, "user"]
```

### 2. Extract Query Functions

Keep query functions reusable:

```typescript
// api/queries.ts
export const queries = {
  users: {
    all: () => ({
      queryKey: ["users"],
      queryFn: () => fetch("/api/users").then((r) => r.json()),
    }),
    detail: (id: string) => ({
      queryKey: ["users", id],
      queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()),
    }),
  },
};

// Usage
const { data } = useQuery(queries.users.detail(userId));
```

### 3. Error Handling

Always handle errors gracefully:

```typescript
const { data, error, isError } = useQuery({
  queryKey: ["data"],
  queryFn: async () => {
    const res = await fetch("/api/data");
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
});

if (isError) {
  return <ErrorBanner message={error.message} />;
}
```

### 4. Loading States

Distinguish between initial load and background refresh:

```typescript
const { data, isLoading, isFetching } = useQuery({...});

// isLoading: true only on first load (no cached data)
// isFetching: true whenever a request is in flight

if (isLoading) {
  return <Skeleton />; // Full loading UI
}

return (
  <div>
    {isFetching && <RefreshIndicator />} {/* Subtle indicator */}
    <DataDisplay data={data} />
  </div>
);
```

### 5. Prefetching

Prefetch data before navigation:

```typescript
const queryClient = useQueryClient();

// Prefetch on hover
<Link
  to={`/users/${userId}`}
  onMouseEnter={() => {
    queryClient.prefetchQuery(queries.users.detail(userId));
  }}
>
  View User
</Link>
```

## Common Mistakes to Avoid

1. **Don't put functions in queryKey** - They break caching
2. **Don't fetch in useEffect** - Use useQuery instead
3. **Don't forget to invalidate** - After mutations, invalidate related queries
4. **Don't use staleTime: Infinity** - Unless data truly never changes
5. **Don't ignore error states** - Always provide error UI
6. **Don't duplicate queryFn logic** - Extract to reusable functions

## TypeScript Types

```typescript
import type { UseQueryResult, UseMutationResult } from "@tanstack/react-query";

interface User {
  id: string;
  name: string;
  email: string;
}

// Type your query results
const { data }: UseQueryResult<User> = useQuery({
  queryKey: ["user", id],
  queryFn: () => fetchUser(id),
});

// Type your mutations
const mutation: UseMutationResult<User, Error, { name: string }> = useMutation({
  mutationFn: (data) => createUser(data),
});
```

## DevTools

Enable React Query DevTools for debugging:

```typescript
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// In your QueryProvider
<QueryClientProvider client={queryClient}>
  {children}
  <ReactQueryDevtools
    initialIsOpen={false}
    buttonPosition="bottom-right"
  />
</QueryClientProvider>
```

DevTools show:
- All active queries and their state
- Cache contents and timing
- Query invalidation triggers
- Mutation history

## References

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Router 7 Data Loading](https://reactrouter.com/en/main/route/loader)
- [Cloudflare Agents](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/)
