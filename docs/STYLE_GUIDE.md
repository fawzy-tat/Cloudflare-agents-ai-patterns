# Style Guide & UI Patterns

This document outlines the design system and UI patterns used in the Cloudflare Agents + Vercel AI SDK Demo project. The design is inspired by **hand-drawn sketch illustrations** with a warm, approachable, and educational aesthetic.

---

## Design Philosophy

Our design language emphasizes:

- **Hand-drawn warmth**: Slightly imperfect, human-feeling visuals
- **Educational clarity**: Clear visual hierarchies for learning
- **Playful professionalism**: Friendly but technically credible
- **Seamless illustration integration**: UI that complements sketch-style diagrams

---

## Color Palette

### Primary Colors

| Color Name        | Hex Value | CSS Variable   | Usage                                 |
| :---------------- | :-------- | :------------- | :------------------------------------ |
| **Cream**         | `#FAF8F5` | `--cream`      | Primary background                    |
| **Warm White**    | `#FFFEF9` | `--warm-white` | Card backgrounds                      |
| **Golden Yellow** | `#F5A623` | `--golden`     | Connection pipes, highlights, accents |
| **Amber**         | `#E8941A` | `--amber`      | Hover states, darker accent           |

### Accent Colors

| Color Name     | Hex Value | CSS Variable    | Usage                          |
| :------------- | :-------- | :-------------- | :----------------------------- |
| **Crimson**    | `#C73E4B` | `--crimson`     | CTA buttons, important actions |
| **Rust Red**   | `#9B3344` | `--rust`        | Hover states for crimson       |
| **Soft Coral** | `#F4D4C8` | `--coral-light` | Subtle highlights              |

### Neutral Colors

| Color Name     | Hex Value | CSS Variable   | Usage                  |
| :------------- | :-------- | :------------- | :--------------------- |
| **Charcoal**   | `#2D2A26` | `--charcoal`   | Primary text, outlines |
| **Warm Gray**  | `#6B6560` | `--warm-gray`  | Secondary text         |
| **Stone**      | `#A09A92` | `--stone`      | Muted text, borders    |
| **Cloud Gray** | `#E8E4DF` | `--cloud`      | Card fills, dividers   |
| **Cream Dark** | `#F0EBE3` | `--cream-dark` | Subtle backgrounds     |

### Pattern Theme Colors

Each integration pattern has a dedicated color for visual differentiation:

| Pattern             | Primary   | Light BG  | Usage                    |
| :------------------ | :-------- | :-------- | :----------------------- |
| **WebSocket**       | `#F5A623` | `#FEF7E6` | Bidirectional, real-time |
| **HTTP Middleware** | `#F5A623` | `#FEF7E6` | Standard streaming       |
| **RPC Methods**     | `#C73E4B` | `#FCEBED` | Custom method calls      |
| **Zero-Config**     | `#F5A623` | `#FEF7E6` | Simple auto-routing      |

---

## Typography

### Font Stack

```css
--font-display: "Caveat", "Permanent Marker", cursive; /* Headings, labels */
--font-body: "Nunito", "Quicksand", sans-serif; /* Body text */
--font-mono: "JetBrains Mono", "Fira Code", monospace; /* Code snippets */
```

### Type Scale

| Element           | Font    | Size             | Weight | Style                    |
| :---------------- | :------ | :--------------- | :----- | :----------------------- |
| **Page Title**    | Display | 2rem (32px)      | 700    | Slightly rotated (-1deg) |
| **Section Title** | Display | 1.5rem (24px)    | 600    | Normal                   |
| **Card Title**    | Body    | 1.125rem (18px)  | 600    | Normal                   |
| **Body**          | Body    | 0.9375rem (15px) | 400    | Normal                   |
| **Small/Caption** | Body    | 0.8125rem (13px) | 400    | Normal                   |
| **Code**          | Mono    | 0.8125rem (13px) | 500    | Normal                   |

### Heading Styles

Headings should feel hand-written. Apply subtle transforms for organic feel:

```css
.sketch-heading {
  font-family: var(--font-display);
  transform: rotate(-0.5deg);
  letter-spacing: -0.02em;
}
```

---

## Border & Shadow Styles

### Sketch Borders

Borders should appear hand-drawn with slight irregularity:

```css
/* Standard sketch border */
.sketch-border {
  border: 2px solid var(--charcoal);
  border-radius: 12px;
  box-shadow: 3px 3px 0 var(--charcoal);
}

/* Lighter sketch border for cards */
.sketch-border-light {
  border: 2px solid var(--cloud);
  border-radius: 16px;
  box-shadow: 2px 2px 0 var(--cloud);
}
```

### Shadow Styles

Shadows should be offset and solid (not blurred) for the sketch aesthetic:

```css
/* Hard offset shadow */
.sketch-shadow {
  box-shadow: 4px 4px 0 var(--charcoal);
}

/* Colored accent shadow */
.sketch-shadow-golden {
  box-shadow: 4px 4px 0 var(--golden);
}

/* Lifted/hover state */
.sketch-shadow-lifted {
  box-shadow: 6px 6px 0 var(--charcoal);
  transform: translate(-2px, -2px);
}
```

---

## Component Patterns

### 1. Pattern Cards (Main Feature)

Cards representing integration patterns should feel like hand-drawn frames:

```tsx
<div
  className="
  relative bg-warm-white 
  border-2 border-charcoal 
  rounded-2xl 
  shadow-[4px_4px_0_theme(colors.charcoal)]
  hover:shadow-[6px_6px_0_theme(colors.charcoal)]
  hover:-translate-x-0.5 hover:-translate-y-0.5
  transition-all duration-200
  overflow-hidden
"
>
  {/* Pattern number badge - rounded circle */}
  <div
    className="
    absolute -top-3 -left-3 
    w-10 h-10 
    bg-golden 
    border-2 border-charcoal 
    rounded-full 
    flex items-center justify-center
    font-display font-bold text-charcoal
    shadow-[2px_2px_0_theme(colors.charcoal)]
  "
  >
    1
  </div>

  {/* Card content */}
  <div className="p-6 pt-8">
    <h3 className="font-display text-2xl text-charcoal">WebSocket Streaming</h3>
    {/* ... */}
  </div>
</div>
```

### 2. Connection Flow Diagrams

Visual flow indicators should mimic the golden pipes from the illustration:

```tsx
<div
  className="
  flex items-center gap-2
  bg-golden/20
  border-2 border-golden
  rounded-full
  px-4 py-2
"
>
  <span className="bg-warm-white border-2 border-charcoal rounded-lg px-3 py-1 font-mono text-sm">
    useAgent
  </span>
  <ArrowRight className="text-charcoal" />
  <span className="bg-warm-white border-2 border-charcoal rounded-lg px-3 py-1 font-mono text-sm">
    /agents/:agent/:id
  </span>
  <ArrowRight className="text-charcoal" />
  <span className="bg-warm-white border-2 border-charcoal rounded-lg px-3 py-1 font-mono text-sm">
    onMessage()
  </span>
</div>
```

### 3. Node Elements (Frontend/Agent)

Cloud-like shapes for nodes:

```tsx
<div
  className="
  relative
  bg-cloud 
  border-2 border-charcoal 
  rounded-[32px]
  px-6 py-4
  shadow-[3px_3px_0_theme(colors.charcoal)]
"
>
  {/* Robot face icon */}
  <div
    className="
    w-8 h-8 rounded-full 
    bg-warm-white border-2 border-charcoal
    flex items-center justify-center
  "
  >
    <Bot className="w-5 h-5 text-charcoal" />
  </div>
  <span className="font-display text-sm text-charcoal uppercase tracking-wide">
    Agent Node
  </span>
</div>
```

### 4. Tags/Badges (Pill Style)

Rounded pill badges like in the illustration:

```tsx
<span
  className="
  inline-flex items-center
  bg-cream-dark
  border border-stone
  rounded-full
  px-3 py-1
  font-body text-xs text-warm-gray
  shadow-[1px_1px_0_theme(colors.stone)]
"
>
  Real-time Chat
</span>
```

### 5. Action Buttons

Primary CTA buttons should use the crimson accent:

```tsx
{
  /* Primary action - Crimson */
}
<button
  className="
  bg-crimson 
  text-warm-white
  border-2 border-charcoal
  rounded-xl
  px-6 py-3
  font-body font-semibold
  shadow-[4px_4px_0_theme(colors.charcoal)]
  hover:shadow-[2px_2px_0_theme(colors.charcoal)]
  hover:translate-x-0.5 hover:translate-y-0.5
  active:shadow-none
  active:translate-x-1 active:translate-y-1
  transition-all duration-150
"
>
  Try Pattern
</button>;

{
  /* Secondary action - Golden */
}
<button
  className="
  bg-golden 
  text-charcoal
  border-2 border-charcoal
  rounded-xl
  px-6 py-3
  font-body font-semibold
  shadow-[4px_4px_0_theme(colors.charcoal)]
  hover:shadow-[2px_2px_0_theme(colors.charcoal)]
  hover:translate-x-0.5 hover:translate-y-0.5
  transition-all duration-150
"
>
  Learn More
</button>;
```

### 6. Page Header

```tsx
<header
  className="
  bg-cream
  border-b-2 border-charcoal
  sticky top-0 z-10
"
>
  <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
    <div>
      <h1 className="font-display text-3xl text-charcoal transform -rotate-1">
        Agent Integration Patterns
      </h1>
      <p className="font-body text-warm-gray mt-1">
        Four architectural approaches for AI agents
      </p>
    </div>
    <div className="flex items-center gap-3">{/* Stack badges */}</div>
  </div>
</header>
```

---

## Illustrations Integration

### Background Treatment

The background should feel like paper/notebook:

```css
.paper-bg {
  background-color: var(--cream);
  background-image: radial-gradient(
    circle at 1px 1px,
    var(--stone) 1px,
    transparent 0
  );
  background-size: 24px 24px;
}
```

### Image Containers

When embedding sketch illustrations:

```tsx
<div
  className="
  bg-warm-white
  border-2 border-charcoal
  rounded-2xl
  p-4
  shadow-[4px_4px_0_theme(colors.charcoal)]
"
>
  <img
    src="/images/diagram.png"
    alt="Architecture diagram"
    className="w-full rounded-lg"
  />
</div>
```

---

## Animation Guidelines

Keep animations subtle and playful:

```css
/* Hover lift effect */
.hover-lift {
  transition: all 0.2s ease;
}
.hover-lift:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--charcoal);
}

/* Gentle wiggle for emphasis */
@keyframes wiggle {
  0%,
  100% {
    transform: rotate(-1deg);
  }
  50% {
    transform: rotate(1deg);
  }
}
.wiggle {
  animation: wiggle 0.3s ease-in-out;
}

/* Bounce for CTAs */
@keyframes gentle-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}
```

---

## Icons

Use [Lucide React](https://lucide.dev/icons/) with consistent sizing and the charcoal color.

| Context          | Size       | Stroke Width |
| :--------------- | :--------- | :----------- |
| Inline with text | 16px (w-4) | 2            |
| Card headers     | 20px (w-5) | 2            |
| Feature icons    | 24px (w-6) | 1.5          |
| Hero elements    | 32px (w-8) | 1.5          |

### Common Icons

- `Bot` - Agent nodes
- `Monitor` - Frontend nodes
- `ArrowRight` - Flow connections
- `Zap` - WebSocket/real-time
- `Lock` - Authentication/middleware
- `MousePointer` - Custom methods/RPC
- `Sparkles` - AI/magic features

---

## Responsive Design

### Breakpoints

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Mobile Adaptations

- Reduce shadow offsets from 4px to 2px
- Stack flow diagrams vertically
- Increase touch targets to 44px minimum
- Simplify card layouts to single column

---

## Dark Mode Considerations

While the primary aesthetic is light/paper-like, dark mode should feel like a chalkboard:

```css
.dark {
  --cream: #1c1917; /* Stone 900 */
  --warm-white: #292524; /* Stone 800 */
  --charcoal: #fafaf9; /* Stone 50 */
  --cloud: #44403c; /* Stone 700 */
  --golden: #fcd34d; /* Amber 300 */
  --crimson: #fb7185; /* Rose 400 */
}
```

---

## Do's and Don'ts

### Do ✓

- Use hard offset shadows (no blur)
- Apply slight rotations to headings
- Keep rounded corners generous (12-24px)
- Use the golden/amber for highlighting connections
- Maintain the warm, papery color palette

### Don't ✗

- Use gradient backgrounds
- Apply drop shadows with blur
- Use sharp corners (< 8px radius)
- Mix in cold blues or grays
- Overuse the crimson accent
