---
name: web-prototype-canvas
description: Adds a canvas view to a Next.js (App Router) web prototype preview. It's a pannable, zoomable board showing every page of the app's flows side by side as live, scaled-down renders at the chosen viewport size, joined by arrows labelled with the action that moves between them; clicking a page opens the prototype there. Use this whenever someone wants a flow map, user-flow diagram, sitemap of pages, storyboard, overview of every page or step, a Figma-style board of a web prototype, or to see pages side by side, even if they don't say "canvas". Needs the web prototype preview (web-prototype-preview skill), which it sets up first if missing. For Expo / React Native apps use prototype-canvas instead.
---

# Web prototype canvas (Next.js App Router)

Adds a **Prototype | Canvas** switch to the `/preview` page. Canvas shows every step of the app's flows at once, each as the real page at the viewport size picked in the toolbar (desktop cards are wide, mobile cards are tall):

```
 [Desktop · 1440 × 900 ▾]       [ Prototype | Canvas ]
 ┌────────┐ Click a product ┌────────┐ Click Buy now ┌────────┐
 │  Home  │ ──────────────▶ │Product │ ────────────▶ │Checkout│ ─▶ …
 └────────┘                 └────────┘               └────────┘
                                 │ Click Reviews
                                 ▼
                            ┌────────┐
                            │Reviews │
                            └────────┘
 [− 38% + | Fit]  Drag to pan · Pinch or ⌘-scroll to zoom
```

Each card is the live page in its own iframe. It follows the panel's settings, so switching language relabels every card, server-rendered copy included. Clicking a card opens the prototype at that step.

The board, arrow routing, pan and zoom live in `Canvas.tsx` and don't need changing. The app-specific part is **`steps.ts`**: which pages make up the flows, how to open each one directly, and what the user does to get from one to the next.

## 1. Make sure the preview exists

Look for `<source-root>/prototype-preview/PreviewPage.tsx`. If it's missing, follow the `web-prototype-preview` skill first, then come back.

## 2. Copy the templates

```bash
bash <this-skill-dir>/scripts/install.sh <source-root>
```

This adds `prototype-preview/Canvas.tsx` and `prototype-preview/steps.ts`.

## 3. Map the flows into `steps.ts`

Read the `app/` directory and the pages before writing anything. Every `page.tsx` is a route; folders in `(parentheses)` are groups and don't appear in the URL; `[param]` folders need a value. For each page, find:

- **How it's reached**: `<Link href>`, `router.push`/`router.replace`, `redirect()` in server actions, and form `action`s in other pages, plus the element that triggers each one. That element becomes the arrow's `action`, written as what the user does with the element's real label: "Click Buy now", "Submit the address form", "Pick a plan".
- **What it needs to open directly**: dynamic segments (`/product/[id]` needs a real id from the app's data), `searchParams` it reads, and any state an earlier step would have set (a cart in context or localStorage, a draft in a cookie). A step opened by URL alone must still render something sensible. Use sample values that exist in the app's data, and keep the same choices across the flow so the pages read as one journey.

Then lay them out:

- **Main flow** left to right along `row: 0`, in the order the user meets the pages: `col: 0, 1, 2…`
- **Side pages** (detail pages, dialogs that are routes, intercepted or parallel-route modals opened from a step) go on `row: 1+`, in the column of the step that opens them, or one along if that spot is taken.
- **Separate flows** (account, settings, onboarding) go on later rows of their own, each starting at `col: 0`.
- `id`s are stable slugs; `title`s are short page names, as a designer would label them.

Leave out `/preview` itself, API routes, `not-found`, error pages, redirect-only routes, and pages that can't render without data the prototype can't fake. Every card is a live copy of the app. 6–15 steps is comfortable; past roughly 20, split the board by flow (a setting choosing which flow to show) instead of drawing everything.

**Steps that depend on settings**: if a dev setting changes a flow, branch on `settings` in `getPrototypeFlow`, so the board matches what the prototype does now. Remove the `void settings;` line once you use it.

**When a step can't be opened directly**, because it only works with state built up in earlier steps: first see whether the page can fall back to sample data when that state is missing, which also makes the prototype sturdier. Otherwise leave the step out and tell the user which one and why. Don't add a step that renders broken.

**Auth**: cards load with the browser's cookies. If pages need a signed-in user, the board works once you're signed in in that browser. Say so in your summary if it applies.

## 4. Switch the route to the canvas

Update `<app-dir>/preview/page.tsx`. It must stay a client component, since it passes a component as a prop:

```tsx
'use client';

import { Canvas } from '@/prototype-preview/Canvas';
import { PreviewPage } from '@/prototype-preview/PreviewPage';

export default function Preview() {
  return <PreviewPage canvas={Canvas} />;
}
```

## 5. Check it

Open `/preview`, switch to **Canvas**, and check:

1. Every card shows its real page. A blank card, a 404 or an error means the href, params or sample data are wrong (step 3).
2. Arrows connect the right steps, with labels matching the real button and link text.
3. Clicking a card switches to Prototype at that page. In-app Back or Cancel buttons there either go back within the frame or do nothing; the preview page itself never navigates away.
4. The page open in the prototype has the highlighted border when you switch back to Canvas.
5. Switching viewport (Desktop to Mobile) relays out every card at the new size; changing a flow setting rearranges the board; changing language relabels every card.
6. Drag pans, pinch or ⌘-scroll zooms, and **Fit** shows the whole board.

Then run the typecheck and lint.
