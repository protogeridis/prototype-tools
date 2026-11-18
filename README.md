# prototype-tools

A Claude Code plugin marketplace for prototyping React Native (Expo Router) and Next.js apps.

## `prototype-preview` plugin

Four skills, a preview and a canvas for each platform. Claude picks them up when you ask for this kind of thing; you don't need to name them.

| Skill | Platform | Ask for something like | What you get |
|---|---|---|---|
| `prototype-preview` | Expo / React Native | "Set up a browser preview of the app in a phone frame with a language switcher" | A `/preview` page: the live app in an iPhone or Pixel frame, with a settings panel on the right (language, sample-data scenarios, layout and flow variants) that applies changes without reloading. |
| `prototype-canvas` | Expo / React Native | "Show every screen of the flow side by side, like a Figma board" | A **Canvas** view on `/preview`: every step as a live phone frame, joined by arrows labelled with the action between them. Click a step to open the prototype there. |
| `web-prototype-preview` | Next.js App Router | "Add a preview page where we can see the site at desktop and mobile sizes and switch languages" | A `/preview` page: the live app at Desktop, Laptop, Tablet or Mobile size (or filling the window), with the same settings panel. Server components follow the settings too. |
| `web-prototype-canvas` | Next.js App Router | "Map out every page of the checkout flow on one board" | A **Canvas** view on `/preview`: every page as a live, scaled-down render at the chosen viewport size, joined by labelled arrows. |

The skills copy tested template code (in each skill's `templates/`) into the app. Claude then does the app-specific parts: which settings exist, connecting the language setting to the app's i18n, the flow map, and the root layout.

## Install

Once per person:

```
/plugin marketplace add https://github.com/protogeridis/prototype-tools.git
/plugin install prototype-preview@prototype-tools
```

Or set it up for everyone working in a project, by committing this to the project's `.claude/settings.json`. Claude Code then offers to install it when someone opens the project:

```json
{
  "extraKnownMarketplaces": {
    "prototype-tools": {
      "source": { "source": "git", "url": "https://github.com/protogeridis/prototype-tools.git" }
    }
  },
  "enabledPlugins": {
    "prototype-preview@prototype-tools": true
  }
}
```

## Changing it

- **Template code** lives in `plugins/prototype-preview/skills/*/templates/`. Fix bugs there, so every future install gets the fix. Apps that already have the preview keep their own copy.
- **Instructions** live in each `SKILL.md`. Keep them about the decisions Claude has to make for each app.
- Bump `version` in `plugins/prototype-preview/.claude-plugin/plugin.json` when you change something, so installs update.
- **Tests**: `skills/*/evals/` holds test cases (a small shop app plus what a good result looks like). Run them with `claude plugin eval <skill-dir> --allow-tools Write,Edit,Bash --scaffold`.
