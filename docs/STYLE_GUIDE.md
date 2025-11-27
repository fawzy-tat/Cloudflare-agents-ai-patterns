# Style Guide & UI Patterns

This document outlines the design system and UI patterns used in the Cloudflare Agents + Vercel AI SDK Demo project. We use [shadcn/ui](https://ui.shadcn.com/) components with Tailwind CSS for styling.

## Color System

We use specific color themes to differentiate between the integration patterns. These colors are applied to badges, borders, backgrounds, and icons.

| Pattern            | Theme Color | Tailwind Class | Usage                                |
| :----------------- | :---------- | :------------- | :----------------------------------- |
| **WebSocket**      | Blue        | `blue`         | Real-time, bidirectional connections |
| **HTTP Streaming** | Orange      | `orange`       | REST API standard streaming          |
| **RPC Method**     | Purple      | `purple`       | Direct method invocation (RPC)       |
| **HTTP Direct**    | Emerald     | `emerald`      | Auto-routed direct access            |

### Implementation Reference

When applying these themes, use the following transparency levels for consistency:

- **Borders**: `border-{color}-500/20` (e.g., `border-blue-500/20`)
- **Backgrounds (Light)**: `bg-{color}-50/50` or `bg-{color}-50/10`
- **Backgrounds (Dark)**: `bg-{color}-900/20` or `bg-{color}-900/5`
- **Text**: `text-{color}-600` (Light) / `text-{color}-400` (Dark)
- **Icons**: `text-{color}-500`

## Component Patterns

### 1. Page Header

Standard layout for all route pages.

```tsx
<header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
  <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <span className="text-{color}-500">{ICON}</span>
          {PAGE_TITLE}
        </h1>
        <p className="text-muted-foreground text-xs">{SUBTITLE}</p>
      </div>
    </div>
    {/* Right side: Badges */}
    <div className="flex items-center gap-3">
      <Badge variant="outline" className="...">
        Agent Type
      </Badge>
      <Badge variant="secondary" className="font-mono text-xs">
        ID: {sessionId}
      </Badge>
    </div>
  </div>
</header>
```

### 2. Input Card

The prompt input area uses a colored border and subtle background tint to match the page theme.

```tsx
<Card className="border-{color}-500/20 bg-{color}-50/10 dark:bg-{color}-900/5 shadow-sm">
  <CardHeader>
    <CardTitle className="text-base flex items-center gap-2">
      <Sparkles className="w-4 h-4 text-{color}-500" />
      Prompt the Agent
    </CardTitle>
  </CardHeader>
  <CardContent>{/* Input Form */}</CardContent>
</Card>
```

### 3. Response Card

Displays the agent's output. It changes state when streaming.

- **Idle**: Standard `border-border`
- **Streaming**: Colored border + shadow glow
  - Class: `border-{color}-500/40 shadow-[0_0_15px_-3px_rgba(R,G,B,0.15)]`

### 4. Technical Details ("Under the hood")

A dashed-border card used to explain technical implementation details.

```tsx
<Card className="bg-muted/30 border-dashed">
  <CardHeader className="pb-3">
    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
      <Info className="w-4 h-4" />
      Under the hood
    </CardTitle>
  </CardHeader>
  <CardContent className="text-sm text-muted-foreground space-y-3">
    {/* Content Steps */}
  </CardContent>
</Card>
```

### 5. Inline Code Snippets

For highlighting code within text descriptions.

```tsx
<code className="text-xs bg-muted px-1 py-0.5 rounded border">
  functionName()
</code>
```

## Typography

- **Headings**: `font-semibold tracking-tight`
- **Subtitles**: `text-muted-foreground text-xs` or `text-sm`
- **Monospace**: `font-mono text-xs` (for IDs, endpoints, code)
- **Body Text**: `text-sm leading-relaxed`

## Icons

We use [Lucide React](https://lucide.dev/icons/) icons. Emojis should **not** be used in the UI; always prefer icons for visual cues.

- **Common Icons**:
  - `ArrowLeft`: Back navigation
  - `Send`: Submit button
  - `Sparkles`: Input section header
  - `Terminal`: Empty state placeholder
  - `Info`: Technical details section
  - `Zap`: Comparison / Key features
  - `RefreshCw`: Reload / Reset actions

## UX Patterns

1. **Streaming State**:

   - Disable input while streaming.
   - Show spinner in button.
   - Show "Streaming..." indicator in response card (optional).
   - Auto-scroll to bottom of response.

2. **Empty States**:

   - Use a centered icon + helper text in the response area when no data exists.

3. **Feedback**:
   - Show error messages in a `destructive` colored alert box within the response area.
