---
name: prototype-preview
description: Sets up a web prototype preview for an Expo / React Native app at /preview. The app runs live in a phone frame (iPhone, Pixel, SE), with a right-hand settings panel to switch language, sample-data scenarios and layout or flow variants without reloading. Use this whenever someone wants to preview, demo, share or review a React Native or Expo prototype in a browser; show the app in a device frame or mockup; add a dev or settings panel, language switcher or locale toggle; or compare design variants side by side, even if they don't say "preview". Also the first step before adding the prototype canvas. For Next.js web apps use web-prototype-preview instead.
---

# Prototype preview

Builds a `/preview` page into an Expo Router app. It shows the app running in a phone frame, with a floating side panel of settings that apply live:

```
┌──────────────────────────────────────────┬─────────────────┐
│ [iPhone 17 Pro ▾]                         │ Prototype       │
│                                           │ Restart · Reset │
│              ┌──────────┐                 │─────────────────│
│              │ 9:41  ▂▄▆│                 │ Language        │
│              │          │                 │ [EN | FR | DE]  │
│              │   the    │                 │ Scenario        │
│              │   app    │                 │ [New ▾]         │
│              │  (live)  │                 │ Home layout     │
│              └──────────┘                 │ [List | Hero]   │
│             402 × 874 pt                  │                 │
└──────────────────────────────────────────┴─────────────────┘
```

The app runs in an iframe of the same site, so it's the real app, not a screenshot. The page and the app talk over `postMessage`: the page sends settings in, and the app reports its route and status bar style back. Settings live in a small store (`preview/devSettings.ts`) that app code reads with `useDevSettings()`. The panel is generated from that store's groups.

The templates are tested code. Copy them, then do the parts that depend on the app: the config, which settings exist, the i18n wiring, the root layout and the route. Rewriting the components from scratch loses fixes for problems you won't see until later: iframe safe areas, status bar colour over modals, scaling to the window, scrollbars inside the frame.

## 1. Check the project

- **Expo Router.** The templates use `expo-router` (`Redirect`, `usePathname`, `useSegments`). If the app uses plain React Navigation, it still works, but the route file and `PreviewSafeArea` need adapting to React Navigation's equivalents. Say so before going ahead.
- **Web support.** `react-dom` and `react-native-web` must be installed. If they aren't, add them with `npx expo install react-dom react-native-web` (`bunx expo install` in Bun projects). Use `expo install` rather than npm or yarn so the versions match the SDK.
- **The source root.** This is the folder holding the routes folder: `src` for `src/app/`, `.` for a root-level `app/`. Everything below is relative to it.
- **The Expo SDK.** Read the `expo` version in `package.json`. If something in the steps below doesn't match what you see (an API moved or was renamed), trust the versioned docs at `https://docs.expo.dev/versions/v<major>.0.0/` over this file.

## 2. Copy the templates

```bash
bash <this-skill-dir>/scripts/install.sh <source-root>              # app already has i18n, or none needed
bash <this-skill-dir>/scripts/install.sh <source-root> --with-i18n  # app has no i18n yet
```

This adds `<source-root>/preview/`, and `<source-root>/i18n/` with the flag. All imports inside are relative, so path aliases don't matter. Files that already exist are skipped and listed; compare those by hand instead of overwriting.

| File | What it is | Edit? |
|---|---|---|
| `previewConfig.ts` | Panel title, storage key, modal routes, app background | **Yes** |
| `devSettings.ts` | The settings and their options | **Yes**: `DEV_SETTING_GROUPS` only |
| `previewTheme.ts` | Colours and type for the preview's own chrome | Optional (brand accent) |
| `DeviceFrame.tsx` | Phone frames and the `DEVICES` list | Optional (add devices) |
| `PreviewPage.tsx`, `PreviewSettings.tsx`, `Dropdown.tsx`, `SegmentedControl.tsx`, `TextButton.tsx`, `icons.tsx` | Page and controls | No |
| `previewBridge.ts`, `usePrototypeFrame.ts`, `PreviewSafeArea.tsx` | Page ↔ app messaging | No |
| `web-types.d.ts` | Loads Expo's react-native-web types (`hovered`, `cursor`) so the preview compiles even without `expo-env.d.ts` | No |

## 3. Fill in `previewConfig.ts`

- `title`: the app or project name, e.g. "Acme prototype".
- `storageKey`: a unique key such as `'acme-preview'`, so two prototypes on one domain (localhost) don't share saved state.
- `modalRoutes`: the first path segment of every route shown as a modal. Find them in the root `_layout.tsx` (`presentation: 'modal'`, `'formSheet'`, `'fullScreenModal'`). The frame then switches the status bar to light content while one is open, like iOS does.
- `appBackground`: the app's screen background colour, from its theme.

## 4. Decide the settings

Each entry in `DEV_SETTING_GROUPS` becomes a control in the panel: a segmented control when it has up to 3 short options, otherwise a dropdown. The first option is the default. Types, defaults and saved state all follow from this list, so it's the only place to edit.

**Language** is always there. A group with one option is hidden from the panel (there's nothing to pick), so an English-only app shows no Language control until a second language exists. Its options are the languages the app has copy for. Give each a short `label` (`EN`, `FR`) and a `description` showing what changes, such as "French copy, with numbers like 1 862,40." Then connect the setting to the app's copy; how depends on what the app already uses. Read `references/i18n.md` for the options: no i18n yet (use the `--with-i18n` templates), i18next / react-i18next, expo-localization, or Lingui and others.

**Other settings** only earn a place if app code reads them. A control that changes nothing confuses reviewers. Good candidates are things the team is actually deciding or checking:
- **Scenarios**: sample-data states such as new user (empty states), typical, heavy user, or long text and numbers. Usually a hook like `useScenario()` that picks a data set by `useDevSettings().scenario`.
- **Layout variants**: alternative designs of one screen. The screen switches on the setting.
- **Flow variants**: step order, optional steps, feature flags.

If the user hasn't said which settings they want, set up Language and suggest others based on what you see in the app. Don't invent variants they didn't ask for. Each option's `description` should say what a reviewer will see, since it shows under the control.

Read settings in app code with `useDevSettings()` (a hook, for components) or `getDevSettings()` (outside React). They're in-memory, so on a device or in a plain browser tab they stay at their defaults unless something else sets them.

## 5. Wire the root layout

In the root `_layout.tsx`:

```tsx
import { startPreviewBridge } from '../preview/previewBridge'; // path from the layout to <source-root>/preview
import { PreviewSafeArea } from '../preview/PreviewSafeArea';

startPreviewBridge(); // module level, once; does nothing unless the app is inside the preview

// …wrap the navigator, inside SafeAreaProvider:
<SafeAreaProvider>
  <PreviewSafeArea>
    <Stack … />
  </PreviewSafeArea>
</SafeAreaProvider>
```

`PreviewSafeArea` reads `useSafeAreaInsets()`, so it must be inside a `SafeAreaProvider`. If the layout doesn't render one, add it around `PreviewSafeArea`. It also calls `usePathname`/`useSegments`, so it belongs inside the root layout, not above the router.

Why this matters: inside the frame, the app is in a desktop browser with no notch, so its real safe area is zero. `PreviewSafeArea` substitutes the device's insets so content clears the status bar and home indicator that the frame draws over it. Screens that use `useSafeAreaInsets()` or `SafeAreaView` from `react-native-safe-area-context` pick this up automatically. Hard-coded top padding won't, and that's a bug in the app worth pointing out.

## 6. Add the route

Create `<routes-dir>/preview.tsx`, next to the root `_layout.tsx` and outside any tab group or nested stack:

```tsx
import { PreviewPage } from '../preview/PreviewPage';

export default function PreviewRoute() {
  return <PreviewPage />;
}
```

If the root layout is itself `Tabs`, `/preview` would show up as a tab and render inside the tab bar. In that case, move the tabs into a `(tabs)` group under a root `Stack` (the usual Expo Router setup), or at least hide it with `options={{ href: null }}`. The first option is the right one; tell the user why.

On native, `/preview` redirects to `/`, so the route is harmless in device builds.

## 7. Run and check it

Add a launch config if the project has `.claude/launch.json` (or create one), e.g. `npx expo start --web --port 8081`. Then open `http://localhost:8081/preview` and check:

1. The app loads in the frame and its content clears the status bar and home indicator.
2. Changing **Language** changes the copy right away, with no reload. If it doesn't, the language isn't wired to the copy (step 4).
3. Every other setting visibly changes something.
4. Switching device relayouts the app; the window scales the frame down to fit; a narrow window moves the panel below the device.
5. Opening a modal turns the status bar text white, if `modalRoutes` is set.
6. Reloading the page keeps the device and settings.

Then run the project's typecheck and lint, e.g. `npx tsc --noEmit` and `npx expo lint`, and fix anything the new files caused.

## Things that trip people up

- **Settings don't reach the app.** Both sides must import the same `devSettings.ts`. A second copy (say, the old one left in `dev/`) means the app reads a store nobody writes to.
- **Blank frame, or a "not found" page in the frame.** The iframe loads `/` from the same server. That works with `expo start --web` and with `web.output: "single"`. For a static export hosted elsewhere, deep links like `/preview` and `/send/amount` need a rewrite to `index.html` (e.g. Vercel `rewrites`).
- **Scrolling the whole page instead of the screen.** If the app's web stack makes the document scroll instead of the screen's `ScrollView`, give `html, body` `height: 100%`.
- **Fonts look different in the panel.** The chrome uses its own system font stack on purpose, so it reads as tooling, not as part of the design.
- **The canvas.** For a board of every step side by side, use the `prototype-canvas` skill after this one. It plugs into `PreviewPage` with a `canvas` prop.
