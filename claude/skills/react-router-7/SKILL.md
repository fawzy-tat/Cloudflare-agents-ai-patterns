---
name: react-router-7
description: Comprehensive guide for building routes, components, loaders, actions, and pages with React Router 7 Framework mode. Use when creating new routes, implementing data loading/mutations, handling navigation, configuring route modules, or optimizing React Router performance.
---

# React Router 7 Framework Guide

This skill provides comprehensive guidance for building performant web applications with React Router 7 in Framework mode. It covers route configuration, data loading, mutations, navigation, rendering strategies, and best practices.

## Project Structure

```
app/
├── routes.ts              # Route configuration (required)
├── root.tsx               # Root layout (required)
├── entry.client.tsx       # Client entry point (optional)
├── entry.server.tsx       # Server entry point (optional)
├── routes/
│   ├── _index.tsx         # Home route (/)
│   ├── about.tsx          # /about
│   ├── dashboard.tsx      # /dashboard (layout)
│   ├── dashboard._index.tsx  # /dashboard (index)
│   └── dashboard.settings.tsx # /dashboard/settings
└── +types/                # Auto-generated types (don't edit)
    └── *.d.ts
```

---

## Route Configuration (routes.ts)

Routes are configured in `app/routes.ts` using helper functions:

```typescript
import {
  type RouteConfig,
  route,
  index,
  layout,
  prefix,
} from "@react-router/dev/routes";

export default [
  // Index route - renders at /
  index("routes/home.tsx"),

  // Basic route - /about
  route("about", "routes/about.tsx"),

  // Dynamic segment - /products/:id
  route("products/:id", "routes/product.tsx"),

  // Nested routes with layout
  route("dashboard", "routes/dashboard.tsx", [
    index("routes/dashboard/home.tsx"),        // /dashboard
    route("settings", "routes/dashboard/settings.tsx"),  // /dashboard/settings
    route("users/:userId", "routes/dashboard/user.tsx"), // /dashboard/users/:userId
  ]),

  // Layout route (no URL segment)
  layout("routes/marketing-layout.tsx", [
    route("pricing", "routes/pricing.tsx"),    // /pricing
    route("features", "routes/features.tsx"),  // /features
  ]),

  // Route prefix (adds URL segment, no layout)
  ...prefix("api", [
    route("users", "routes/api/users.tsx"),    // /api/users
    route("posts", "routes/api/posts.tsx"),    // /api/posts
  ]),

  // Optional segments - /:lang?/categories
  route(":lang?/categories", "routes/categories.tsx"),

  // Splat/catch-all - /files/*
  route("files/*", "routes/files.tsx"),

  // 404 catch-all (must be last)
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
```

### Route Patterns

| Pattern | Example | Matches |
|---------|---------|---------|
| Static | `about` | `/about` |
| Dynamic | `users/:id` | `/users/123` |
| Optional | `:lang?/about` | `/about` or `/en/about` |
| Splat | `files/*` | `/files/a/b/c` |
| Multiple params | `c/:catId/p/:prodId` | `/c/1/p/2` |

---

## Route Module Exports

Each route file can export these functions and components:

### Component (default export)

The component rendered when the route matches:

```typescript
import type { Route } from "./+types/my-route";

export default function MyRoute({
  loaderData,
  actionData,
  params,
  matches,
}: Route.ComponentProps) {
  return (
    <div>
      <h1>Welcome</h1>
      <p>Data: {loaderData.message}</p>
    </div>
  );
}
```

### loader - Server Data Loading

Runs on the server before rendering. Removed from client bundles:

```typescript
import type { Route } from "./+types/product";
import { data } from "react-router";

export async function loader({ params, request }: Route.LoaderArgs) {
  const product = await db.products.find(params.id);

  if (!product) {
    throw data("Product not found", { status: 404 });
  }

  return { product };
}
```

### clientLoader - Client Data Loading

Runs only in the browser. Can supplement or replace server loader:

```typescript
import type { Route } from "./+types/product";

export async function clientLoader({
  params,
  serverLoader,
}: Route.ClientLoaderArgs) {
  // Option 1: Use only client data
  const cached = localStorage.getItem(`product-${params.id}`);
  if (cached) return JSON.parse(cached);

  // Option 2: Fetch from server and merge
  const serverData = await serverLoader();
  return { ...serverData, clientTimestamp: Date.now() };
}

// Run clientLoader during hydration (shows HydrateFallback first)
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <div>Loading...</div>;
}
```

### action - Server Mutations

Handles form submissions on the server:

```typescript
import type { Route } from "./+types/product";
import { data, redirect } from "react-router";

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const title = formData.get("title") as string;

  // Validation
  const errors: Record<string, string> = {};
  if (!title || title.length < 3) {
    errors.title = "Title must be at least 3 characters";
  }

  if (Object.keys(errors).length > 0) {
    return data({ errors }, { status: 400 });
  }

  // Mutation
  await db.products.update(params.id, { title });

  // Redirect on success
  return redirect(`/products/${params.id}`);
}
```

### clientAction - Client Mutations

Runs only in the browser. Can call server action:

```typescript
import type { Route } from "./+types/product";

export async function clientAction({
  request,
  serverAction,
}: Route.ClientActionArgs) {
  // Optimistic update or client validation
  const formData = await request.formData();

  // Invalidate client cache
  localStorage.removeItem("products-cache");

  // Call server action
  return serverAction();
}
```

### ErrorBoundary

Renders when errors occur in the route:

```typescript
import type { Route } from "./+types/product";
import { isRouteErrorResponse } from "react-router";

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        {import.meta.env.DEV && <pre>{error.stack}</pre>}
      </div>
    );
  }

  return <h1>Unknown Error</h1>;
}
```

### meta - Document Metadata

Define `<title>` and `<meta>` tags:

```typescript
import type { Route } from "./+types/product";

export function meta({ data, params }: Route.MetaArgs) {
  return [
    { title: data?.product?.name ?? "Product" },
    { name: "description", content: data?.product?.description },
    { property: "og:title", content: data?.product?.name },
  ];
}
```

### links - Document Links

Define `<link>` elements for stylesheets, preloads, etc:

```typescript
import type { Route } from "./+types/product";

export function links(): Route.LinksFunction {
  return [
    { rel: "stylesheet", href: "/styles/product.css" },
    { rel: "preload", href: "/images/hero.jpg", as: "image" },
    { rel: "icon", href: "/favicon.png", type: "image/png" },
  ];
}
```

### headers - HTTP Headers

Define response headers (SSR only):

```typescript
export function headers() {
  return {
    "Cache-Control": "max-age=300, s-maxage=3600",
    "X-Custom-Header": "value",
  };
}
```

### handle - Custom Route Data

Attach custom data accessible via `useMatches()`:

```typescript
export const handle = {
  breadcrumb: "Products",
  requiresAuth: true,
};
```

### shouldRevalidate - Control Revalidation

Optimize when loaders re-run after navigation:

```typescript
import type { ShouldRevalidateFunctionArgs } from "react-router";

export function shouldRevalidate({
  currentUrl,
  nextUrl,
  formAction,
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  // Don't revalidate if only search params changed
  if (currentUrl.pathname === nextUrl.pathname) {
    return false;
  }

  return defaultShouldRevalidate;
}
```

---

## Navigation

### Link Component

Basic navigation link:

```typescript
import { Link } from "react-router";

<Link to="/about">About</Link>
<Link to={`/products/${productId}`}>View Product</Link>
<Link to=".." relative="path">Go Back</Link>
```

### NavLink Component

Link with active/pending states for navigation menus:

```typescript
import { NavLink } from "react-router";

<NavLink
  to="/dashboard"
  className={({ isActive, isPending }) =>
    isActive ? "active" : isPending ? "pending" : ""
  }
>
  Dashboard
</NavLink>

// Or with inline styles
<NavLink
  to="/dashboard"
  style={({ isActive }) => ({
    fontWeight: isActive ? "bold" : "normal",
  })}
>
  Dashboard
</NavLink>

// With render function
<NavLink to="/messages">
  {({ isActive, isPending }) => (
    <span>
      Messages {isPending && <Spinner />}
    </span>
  )}
</NavLink>
```

### Programmatic Navigation

```typescript
import { useNavigate } from "react-router";

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### Redirect in Loaders/Actions

```typescript
import { redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  if (!user) {
    return redirect("/login");
  }
  return { user };
}

export async function action({ request }: Route.ActionArgs) {
  const project = await createProject(request);
  return redirect(`/projects/${project.id}`);
}
```

---

## Forms and Data Mutation

### Form Component

Navigate with form submission (creates history entry):

```typescript
import { Form } from "react-router";

<Form method="post">
  <input type="text" name="title" required />
  <button type="submit">Create</button>
</Form>

// With action prop
<Form method="post" action="/api/submit">
  <input type="text" name="query" />
  <button type="submit">Search</button>
</Form>
```

### useFetcher - Non-Navigation Submissions

For mutations without navigation (inline edits, sidebar forms):

```typescript
import { useFetcher } from "react-router";

function InlineEditor({ item }) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";

  // Optimistic UI
  const title = fetcher.formData?.get("title") ?? item.title;

  return (
    <fetcher.Form method="post" action={`/items/${item.id}`}>
      <input
        type="text"
        name="title"
        defaultValue={item.title}
        disabled={isSubmitting}
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save"}
      </button>
      {fetcher.data?.error && (
        <p className="error">{fetcher.data.error}</p>
      )}
    </fetcher.Form>
  );
}
```

### useFetcher for Loading Data

```typescript
import { useFetcher } from "react-router";
import type { loader } from "./search-route";

function SearchCombobox() {
  const fetcher = useFetcher<typeof loader>();

  return (
    <div>
      <fetcher.Form method="get" action="/search">
        <input
          type="text"
          name="q"
          onChange={(e) => fetcher.submit(e.currentTarget.form)}
        />
      </fetcher.Form>

      <ul style={{ opacity: fetcher.state === "idle" ? 1 : 0.5 }}>
        {fetcher.data?.results.map((result) => (
          <li key={result.id}>{result.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Form Validation Pattern

```typescript
// Route action
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const errors: Record<string, string> = {};

  if (!email?.includes("@")) {
    errors.email = "Invalid email address";
  }
  if (!password || password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  if (Object.keys(errors).length > 0) {
    return data({ errors }, { status: 400 });
  }

  // Process valid data
  await createUser({ email, password });
  return redirect("/dashboard");
}

// Component
export default function SignupForm({ actionData }: Route.ComponentProps) {
  const errors = actionData?.errors;

  return (
    <Form method="post">
      <div>
        <input type="email" name="email" />
        {errors?.email && <span className="error">{errors.email}</span>}
      </div>
      <div>
        <input type="password" name="password" />
        {errors?.password && <span className="error">{errors.password}</span>}
      </div>
      <button type="submit">Sign Up</button>
    </Form>
  );
}
```

---

## Pending UI and Loading States

### Global Navigation State

```typescript
import { useNavigation } from "react-router";

function GlobalSpinner() {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);

  if (!isNavigating) return null;

  return <div className="global-spinner">Loading...</div>;
}
```

### Form Submission State

```typescript
import { Form, useNavigation } from "react-router";

function CreateForm() {
  const navigation = useNavigation();
  const isSubmitting = navigation.formAction === "/create";

  return (
    <Form method="post" action="/create">
      <input type="text" name="title" disabled={isSubmitting} />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create"}
      </button>
    </Form>
  );
}
```

### Optimistic UI with Fetcher

```typescript
function TaskItem({ task }) {
  const fetcher = useFetcher();

  // Show optimistic state while submitting
  let status = task.status;
  if (fetcher.formData) {
    status = fetcher.formData.get("status");
  }

  return (
    <div className={status === "complete" ? "completed" : ""}>
      <span>{task.title}</span>
      <fetcher.Form method="post">
        <input type="hidden" name="id" value={task.id} />
        <button
          type="submit"
          name="status"
          value={status === "complete" ? "pending" : "complete"}
        >
          {status === "complete" ? "Undo" : "Complete"}
        </button>
      </fetcher.Form>
    </div>
  );
}
```

---

## Streaming with Suspense

Return promises from loaders for progressive loading:

```typescript
import type { Route } from "./+types/dashboard";

export async function loader() {
  // Critical data - awaited
  const user = await getUser();

  // Non-critical data - NOT awaited (streams later)
  const analyticsPromise = getAnalytics();
  const recommendationsPromise = getRecommendations();

  return {
    user,
    analytics: analyticsPromise,
    recommendations: recommendationsPromise,
  };
}

// Component with Suspense boundaries
import { Suspense } from "react";
import { Await } from "react-router";

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { user, analytics, recommendations } = loaderData;

  return (
    <div>
      {/* Critical data renders immediately */}
      <h1>Welcome, {user.name}</h1>

      {/* Non-critical data streams in */}
      <Suspense fallback={<div>Loading analytics...</div>}>
        <Await resolve={analytics}>
          {(data) => <AnalyticsChart data={data} />}
        </Await>
      </Suspense>

      <Suspense fallback={<div>Loading recommendations...</div>}>
        <Await resolve={recommendations}>
          {(items) => <RecommendationList items={items} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

### React 19 use() Hook

```typescript
import { use, Suspense } from "react";

function Analytics({ promise }) {
  const data = use(promise);
  return <AnalyticsChart data={data} />;
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return (
    <Suspense fallback={<Skeleton />}>
      <Analytics promise={loaderData.analytics} />
    </Suspense>
  );
}
```

---

## Rendering Strategies

Configure in `react-router.config.ts`:

### Server-Side Rendering (default)

```typescript
import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
} satisfies Config;
```

### Client-Side Rendering (SPA mode)

```typescript
import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,
} satisfies Config;
```

### Static Pre-rendering

```typescript
import type { Config } from "@react-router/dev/config";

export default {
  async prerender() {
    // Static pages
    const staticPages = ["/", "/about", "/contact"];

    // Dynamic pages from data
    const products = await db.products.findAll();
    const productPages = products.map((p) => `/products/${p.id}`);

    return [...staticPages, ...productPages];
  },
} satisfies Config;
```

---

## Root Layout (root.tsx)

The root layout wraps all routes:

```typescript
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import type { Route } from "./+types/root";

export const links: Route.LinksFunction = () => [
  { rel: "stylesheet", href: "/styles/global.css" },
  { rel: "icon", href: "/favicon.ico" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404
      ? "The requested page could not be found."
      : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
  }

  return (
    <main>
      <h1>{message}</h1>
      <p>{details}</p>
    </main>
  );
}
```

---

## Middleware

### Server Middleware

Runs on document and data requests:

```typescript
import type { Route } from "./+types/admin";

async function authMiddleware({ request, context }, next) {
  const session = await getSession(request);
  if (!session.userId) {
    return redirect("/login");
  }
  context.user = await getUser(session.userId);
  return next();
}

async function loggingMiddleware({ request }, next) {
  const start = performance.now();
  const response = await next();
  console.log(`${request.method} ${request.url} - ${performance.now() - start}ms`);
  return response;
}

export const middleware = [authMiddleware, loggingMiddleware];
```

### Client Middleware

Runs during client-side navigations:

```typescript
async function analyticsMiddleware({ request }, next) {
  trackPageView(request.url);
  await next();
}

export const clientMiddleware = [analyticsMiddleware];
```

---

## Type Safety

React Router generates types automatically. Import from `./+types/<route-name>`:

```typescript
import type { Route } from "./+types/product";

// All exports are fully typed
export async function loader({ params }: Route.LoaderArgs) {
  // params.id is typed as string
  return { product: await getProduct(params.id) };
}

export async function action({ request }: Route.ActionArgs) {
  // request is typed as Request
  const formData = await request.formData();
  return { success: true };
}

export default function Product({
  loaderData,  // typed as { product: Product }
  actionData,  // typed as { success: boolean } | undefined
  params,      // typed as { id: string }
}: Route.ComponentProps) {
  return <div>{loaderData.product.name}</div>;
}
```

### Generate Types Manually

```bash
# One-time generation
npx react-router typegen

# Watch mode
npx react-router typegen --watch
```

---

## File-Based Routing (Optional)

Use `@react-router/fs-routes` for convention-based routing:

```typescript
// routes.ts
import { flatRoutes } from "@react-router/fs-routes";

export default flatRoutes();
```

### File Naming Conventions

| File | URL | Notes |
|------|-----|-------|
| `_index.tsx` | `/` | Index route |
| `about.tsx` | `/about` | Static route |
| `products.$id.tsx` | `/products/:id` | Dynamic segment |
| `docs.$.tsx` | `/docs/*` | Splat route |
| `($lang).about.tsx` | `/:lang?/about` | Optional segment |
| `_auth.tsx` | - | Layout (no URL) |
| `_auth.login.tsx` | `/login` | Nested in _auth layout |
| `api_.users.tsx` | `/api/users` | Escapes nesting |

---

## Essential Hooks Reference

```typescript
// Navigation
import {
  useNavigate,     // Programmatic navigation
  useLocation,     // Current URL/location
  useParams,       // Route parameters
  useSearchParams, // Query string params
  useMatches,      // All matched routes
  useNavigation,   // Navigation state
} from "react-router";

// Data
import {
  useLoaderData,      // Current route loader data
  useActionData,      // Current route action data
  useRouteLoaderData, // Parent route loader data
  useFetcher,         // Non-navigation data loading
  useFetchers,        // All active fetchers
  useRevalidator,     // Manual revalidation
} from "react-router";

// Errors
import {
  useRouteError,          // Error in error boundary
  isRouteErrorResponse,   // Check if thrown with data()
} from "react-router";
```

---

## Best Practices

### 1. Colocate Route Files
Keep loaders, actions, and components in the same file for better maintainability.

### 2. Use Server Loaders for Sensitive Data
Loaders are removed from client bundles - safe for database queries and secrets.

### 3. Return 400 for Validation Errors
Prevents automatic revalidation of page data:
```typescript
return data({ errors }, { status: 400 });
```

### 4. Use Fetchers for Inline Mutations
Avoid navigation for inline edits, toggles, and sidebar forms.

### 5. Stream Non-Critical Data
Don't block rendering on analytics, recommendations, or secondary content.

### 6. Handle All Error Cases
Always implement ErrorBoundary with isRouteErrorResponse check.

### 7. Optimize Revalidation
Use `shouldRevalidate` to prevent unnecessary data fetching.

### 8. Type Your Routes
Always import from `./+types/<route>` for full type safety.

### 9. Use NavLink for Navigation Menus
Get active/pending states automatically for better UX.

### 10. Prefer redirect() Over useNavigate()
Use `redirect()` in loaders/actions; reserve `useNavigate()` for non-user-initiated navigation.
