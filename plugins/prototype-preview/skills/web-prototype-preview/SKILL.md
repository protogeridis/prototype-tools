---
name: web-prototype-preview
description: Sets up a prototype preview page at /preview for a Next.js (App Router) web app. The live app is shown at chosen viewport sizes (desktop, laptop, tablet, mobile, or fill the window), with a right-hand settings panel to switch language, sample-data scenarios and layout or flow variants without reloading, including in server components. Use this whenever someone wants to preview, demo, share or review a Next.js or React web prototype; check it at different screen sizes or breakpoints; add a dev or settings panel, language switcher or locale toggle; or compare design variants, even if they don't say "preview". Also the first step before the web prototype canvas. For Expo / React Native apps use prototype-preview instead.
---

# Web prototype preview (Next.js App Router)

Builds a `/preview` page into a Next.js App Router app. It shows the app running at a chosen viewport size, with a floating side panel of settings that apply live:

```
┌──────────────────────────────────────────────┬─────────────────┐
│ [Desktop · 1440 × 900 ▾]                      │ Prototype       │
│  ┌─────────────────────────────────────────┐  │ Restart · Reset │
│  │ Corner Shop                    Free del…│  │─────────────────│
│  │                                         │  │ Language        │
│  │   the app, live, scaled to fit          │  │ [EN | FR | DE]  │
│  │                                         │  │ Scenario        │
│  └─────────────────────────────────────────┘  │ [New customer ▾]│
│            1440 × 900 · 41% · /products        │                 │
└──────────────────────────────────────────────┴─────────────────┘
```

How it works, which you need to know to wire it:

- **The app runs in an iframe** of the same site, laid out at the viewport's real width and scaled down to fit, so breakpoints behave as on a real screen. The preview page and the app talk over `postMessage`.
- **Settings live in two places on purpose.** Client components read them from a React context (`useDevSettings()`). Server components can't read client state, so the settings are also written to a cookie, which server components read with `await getDevSettings()`. When a setting changes, the app in the frame calls `router.refresh()`, so server components re-render too. The root layout seeds the context from the cookie, so server and client render the same thing on first load (no hydration mismatch, no flash).
- **The app's back is fenced in.** An iframe shares browser history with the page around it, so an app calling `router.back()` on the first page it opened would navigate the preview page itself away. The provider stops back at the frame's first page, like a fresh tab.

The templates are tested code. Copy them, then do the parts that depend on the app: the config, which settings exist, the i18n wiring, the root layout and the route. Rewriting them loses fixes for problems you won't see until later: hydration, server components following the settings, the shared history, scaling.

## 1. Check the project

- **Next.js App Router**: an `app/` (or `src/app/`) directory with a root `layout.tsx`. For the Pages Router, stop and tell the user it isn't supported yet. For Expo or React Native, use the `prototype-preview` skill.
- **Next.js version** (`package.json`). The templates work on 14 to 16: they `await cookies()`, which is right on 15+ and harmless on 14. If something below doesn't match what you see, trust the docs for that version (or the copy in `node_modules/next/dist/docs/` if the project has one) over this file.
- **The source root**: the folder holding `app/`, so `src` or `.`. Note whether `tsconfig.json` has a path alias such as `@/*`; use it in imports if so, otherwise relative paths.

## 2. Copy the templates

```bash
bash <this-skill-dir>/scripts/install.sh <source-root>
```

This adds `<source-root>/prototype-preview/`. Imports inside it are relative. Existing files are skipped and listed; compare those by hand.

| File | What it is | Edit? |
|---|---|---|
| `previewConfig.ts` | Panel title, storage key, start path, app background, the `VIEWPORTS` list | **Yes** |
| `devSettings.ts` | The settings and their options (shared by server and client) | **Yes**: `DEV_SETTING_GROUPS` only |
| `preview.module.css` | The preview chrome's styles; `--pp-accent` and `--pp-link` set the brand colours | Optional |
| `DevSettingsProvider.tsx` | Client context, cookie sync, iframe messaging, history guard | No |
| `devSettings.server.ts` | `getDevSettings()` for server components | No |
| `PreviewPage.tsx`, `PreviewSettings.tsx`, `controls.tsx`, `usePrototypeFrame.ts`, `previewBridge.ts` | Page, controls, messaging | No |

## 3. Fill in `previewConfig.ts`

- `title`: the app or project name.
- `storageKey`: unique per project (e.g. `'acme-preview'`), so prototypes on the same localhost port don't share saved state.
- `startPath`: where the prototype opens, usually `/`. Use the main signed-in page if `/` is a marketing page or redirects to login.
- `appBackground`: the app's page background, from its CSS.
- `VIEWPORTS`: keep the defaults unless the team targets other sizes. Match the breakpoints in the app's CSS or Tailwind config if they're unusual.

## 4. Decide the settings

Each entry in `DEV_SETTING_GROUPS` becomes a control: a segmented control for up to 3 short options, otherwise a select. A group with only one option is hidden, since there's nothing to pick. The first option is the default. Types, defaults and the cookie all follow from this list, so it's the only place to edit.

**Language**: its options are the languages the app has copy for. Connect the setting to the app's copy; how depends on the app. Read `references/i18n-next.md`. It covers next-intl, locale-prefixed routes (`/fr/...`), dictionary files, react-i18next, and apps with no i18n yet.

**Other settings** only belong if app code reads them. Good candidates: sample-data **scenarios** (new user and empty states, heavy user, long text), **layout variants** of a page, **flow variants** (step order, optional steps, feature flags). If the user hasn't said which they want, set up Language and suggest others from what you see. Don't invent variants. Each option's `description` shows under the control, so write what a reviewer will see.

Reading settings in the app:
- **Client components**: `const { scenario } = useDevSettings()` from `prototype-preview/DevSettingsProvider`.
- **Server components, route handlers, `generateMetadata`**: `const { scenario } = await getDevSettings()` from `prototype-preview/devSettings.server`.
- Data loading: pass the setting into the data function (`getProducts({ scenario })`) instead of reading the cookie deep inside it, so it stays testable.

## 5. Wire the root layout

```tsx
import { DevSettingsProvider } from '@/prototype-preview/DevSettingsProvider';
import { getDevSettings } from '@/prototype-preview/devSettings.server';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getDevSettings();
  return (
    <html lang={settings.language}>
      <body>
        <DevSettingsProvider initialSettings={settings}>{/* existing body content */}</DevSettingsProvider>
      </body>
    </html>
  );
}
```

Wrap everything inside `<body>`, including existing providers, so every client component can read the settings. If the layout already sets `lang` from somewhere else (next-intl, a `[locale]` param), leave that alone.

**Rendering changes**: reading cookies in the root layout makes every route render per request instead of at build time. For a prototype, that's what you want. If this is a production app and the user wants it static, say so and suggest guarding the cookie read behind an env flag (return `DEFAULT_DEV_SETTINGS` when it's off). Don't decide that silently.

## 6. Add the route

Create `<app-dir>/preview/page.tsx`. It must be a client component, because it may pass the canvas component as a prop (step 7 of the canvas skill), and a server page can't pass functions:

```tsx
'use client';

import { PreviewPage } from '@/prototype-preview/PreviewPage';

export default function Preview() {
  return <PreviewPage />;
}
```

The preview page covers the whole window (`position: fixed`), so a header or nav in the root layout doesn't show through, and there's no need to restructure layouts for it. If the root layout redirects unauthenticated users, or middleware does, make sure `/preview` and the pages it frames are reachable the same way the app is: the iframe sends the same cookies, so a signed-in browser works.

If `middleware.ts` rewrites or redirects by locale or auth, check `/preview` isn't caught by it. Add it to the matcher's exclusions if it is.

## 7. Run and check it

Add a launch config if the project has `.claude/launch.json` (e.g. `npx next dev --port 3000`). Open `/preview` and check:

1. The app loads in the frame at Desktop size, scaled to fit, with the path in the caption.
2. Changing **Language** changes the copy within a second, **including text rendered by server components** (headings, page copy), without reloading the preview. If only client components change, the cookie/refresh path isn't wired (step 5) or the server copy doesn't read the setting (step 4).
3. Every other setting visibly changes something.
4. Tablet and Mobile apply the app's responsive layouts; Fill uses the whole stage.
5. Navigate inside the frame, then use any in-app Back or Cancel that calls `router.back()`. It goes back within the frame, and the preview page itself never navigates away.
6. Reloading `/preview` keeps the viewport and the settings. "Open in new tab" opens the current page with the same settings.

Then run the project's typecheck and lint (`npx tsc --noEmit`, `npx next lint` or `npx eslint .`) and fix anything the new files caused.

## Things that trip people up

- **A setting changes client components but not server ones.** The server copy has to read `await getDevSettings()`. A server component that receives settings as props from a client component won't follow them, so read in the server component itself.
- **Hydration mismatch warnings.** Something rendered different values on server and client. Usually a component read `document.cookie` or `localStorage` itself; use `useDevSettings()` instead.
- **Settings stick outside the preview.** They're in a cookie, so opening the app directly in the same browser uses the last settings. That's deliberate (shareable "Open in new tab"); "Reset settings" clears them.
- **The preview reloads once in development** the first time the frame visits a page the dev server hasn't compiled yet. That's Next.js dev compilation, not the preview, and it doesn't happen in a production build.
- **The Next.js dev indicator** shows in the frame in development. Hide it with `devIndicators: false` in `next.config` if it gets in the way of reviews.
- **The canvas**: for every page of a flow side by side, use the `web-prototype-canvas` skill after this one.
