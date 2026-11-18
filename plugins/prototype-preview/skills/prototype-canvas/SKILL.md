---
name: prototype-canvas
description: Adds a canvas view to an Expo / React Native web prototype preview. It's a pannable, zoomable board showing every screen of the app's flows side by side as live phone frames, joined by arrows labelled with the action that moves between them; clicking a screen opens the prototype there. Use this whenever someone wants a flow map, user-flow diagram, screen map, storyboard, overview of every screen or step, a Figma-style board of the prototype, or to see screens side by side, even if they don't say "canvas". Needs the prototype preview (prototype-preview skill), which it sets up first if missing. For Next.js web apps use web-prototype-canvas instead.
---

# Prototype canvas

Adds a **Prototype | Canvas** switch to the `/preview` page. Canvas shows every step of the app's flows at once:

```
 [iPhone 17 Pro ▾]          [ Prototype | Canvas ]
 ┌──────┐   Tap Send    ┌──────┐  Pick a recipient  ┌──────┐
 │ Home │ ────────────▶ │Recip.│ ─────────────────▶ │Amount│ ─▶ …
 └──────┘               └──────┘                    └──────┘
    │ Tap See all                                      │ Tap currency
    ▼                                                  ▼
 ┌──────┐                                           ┌──────┐
 │Trans.│                                           │Picker│
 └──────┘                                           └──────┘
 [− 64% + | Fit]  Drag to pan · Pinch or ⌘-scroll to zoom
```

Each card is the real app, loaded straight at that step's URL in its own frame. It follows the panel's settings, so switching language relabels every screen at once. Clicking a card opens the prototype at that step.

The board, arrow routing, pan and zoom live in `Canvas.tsx` and don't need changing. The app-specific part is **`steps.ts`**: which steps exist, how to open each one directly, and what the user does to get from one to the next. Most of the work, and most of the value, is getting that right.

## 1. Make sure the preview exists

Look for `<source-root>/preview/PreviewPage.tsx`. If it's missing, follow the `prototype-preview` skill first, then come back.

## 2. Copy the templates

```bash
bash <this-skill-dir>/scripts/install.sh <source-root>
```

This adds `preview/Canvas.tsx` and `preview/steps.ts`.

## 3. Map the flows into `steps.ts`

Read the routes folder and the screens before writing anything. For each screen, find:

- **How it's reached**: `router.push`, `router.navigate`, `<Link href>` and `router.replace` calls in other screens, plus the UI element that triggers each one. That element becomes the arrow's `action`, written as what the user does: "Tap Send", "Pick a recipient", "Enter an amount, tap Continue". Use the button's actual label.
- **What it needs to open directly**: the `useLocalSearchParams()` it reads, and any state it expects an earlier step to have set (a draft in a store or context). A step opened by URL alone must still render something sensible. Give it sample params that match the app's sample data, e.g. a real contact id from the mock data, not `id=1`. Use the same sample choices across the whole flow so the screens read as one journey.

Then lay them out:

- **Main flow** left to right along `row: 0`, in the order the user meets the steps: `col: 0, 1, 2…`
- **Side screens** (pickers, sheets, detail screens opened from a step) go on `row: 1+`, in the column of the step that opens them, or one column along if that spot is taken.
- **Separate flows** (settings, onboarding) go on later rows of their own, each starting at `col: 0`.
- `id`s are stable slugs; `title`s are short screen names, as a designer would label them.

Don't include every route. Leave out the preview itself, dev menus, `+not-found`, redirects, and screens that can't render without live data the prototype can't fake. Every card is a live copy of the app, so 6–15 steps is comfortable. Past roughly 20, the board gets heavy; split it by flow (one setting choosing which flow to show) rather than drawing everything.

**Steps that depend on settings.** If a dev setting changes a flow (step order, an optional step), branch on `settings` in `getPrototypeFlow`, so the board matches what the prototype does with the current settings. Remove the `void settings;` line once you use it.

**When a step can't be opened directly**, because it only works with in-memory state from earlier steps: first see if the screen can fall back to sample data when that state is missing, which also makes the prototype sturdier. If that isn't reasonable, leave the step out and tell the user which one and why. Don't add a step that renders broken.

## 4. Make deep-linked steps go back properly

A card opens its step by URL, so there's no history behind it. Without help, its back or close button goes nowhere. Give each stack an initial route so Expo Router puts the first screen underneath. In the root `_layout.tsx` and in each nested stack layout whose screens appear on the board:

```tsx
// A screen opened directly by URL (e.g. a step picked on the preview's canvas) gets this one
// beneath it, so back and close have somewhere to go.
export const unstable_settings = { initialRouteName: 'index' };
```

Use that stack's actual first screen. Check the current Expo Router docs for your SDK version if `unstable_settings` has been renamed.

## 5. Switch the route to the canvas

Update `<routes-dir>/preview.tsx`:

```tsx
import { Canvas } from '../preview/Canvas';
import { PreviewPage } from '../preview/PreviewPage';

export default function PreviewRoute() {
  return <PreviewPage canvas={Canvas} />;
}
```

## 6. Check it

Open `/preview`, switch to **Canvas**, and check:

1. Every card shows its real screen. A blank card, a "not found" page or an error means the href or params are wrong (step 3).
2. Arrows connect the right steps, and their labels match the actual button text.
3. Clicking a card switches to Prototype at that step, and its back or close button works (step 4).
4. The step open in the prototype has the highlighted border when you switch back to Canvas.
5. Changing a setting that affects the flow rearranges the board. Changing language relabels every card.
6. Drag pans, pinch or ⌘-scroll zooms, and **Fit** shows the whole board.

Then run the typecheck and lint.
