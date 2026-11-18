import { useSyncExternalStore } from 'react';

// Settings for trying out alternatives in the prototype: language, sample data, layout and flow
// variants. Changed from the web preview's side panel (/preview), which sends them into the app
// running in its device frame. Held in memory, so a full reload resets them (the preview keeps
// its own copy and sends it again).
//
// To add a setting, add a group below: the panel, the saved state and the types all follow from
// it. Read settings in the app with useDevSettings(), e.g. `const { language } = useDevSettings()`.

// `label` is a short name for compact controls (the panel's segmented controls); `description`
// shows under the control while the option is selected.
export type DevOption = { value: string; title: string; label: string; description: string };
export type DevSettingGroup = { key: string; title: string; caption: string; options: readonly DevOption[] };

// Every setting, in display order. The first option of each group is its default.
export const DEV_SETTING_GROUPS = [
  {
    key: 'language',
    title: 'Language',
    caption: 'Copy and formats',
    options: [{ value: 'en', title: 'English', label: 'EN', description: 'English copy, with numbers like 1,862.40.' }],
  },
] as const satisfies readonly DevSettingGroup[];

type Group = (typeof DEV_SETTING_GROUPS)[number];
export type DevSettings = { [G in Group as G['key']]: G['options'][number]['value'] };
export type DevSettingKey = keyof DevSettings;
export type Language = DevSettings['language'];

// The groups with a uniform type, for code that loops over them.
const groups: readonly DevSettingGroup[] = DEV_SETTING_GROUPS;

export const DEFAULT_DEV_SETTINGS = Object.fromEntries(
  groups.map((group) => [group.key, group.options[0].value]),
) as DevSettings;

let settings: DevSettings = DEFAULT_DEV_SETTINGS;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => settings;

// Applies any valid settings from an untyped source (the preview's messages, localStorage),
// ignoring unknown keys and values.
export function applyDevSettings(input: unknown) {
  if (!input || typeof input !== 'object') return;
  const changes: Record<string, string> = {};
  for (const group of groups) {
    const value = (input as Record<string, unknown>)[group.key];
    if (typeof value === 'string' && group.options.some((o) => o.value === value)) changes[group.key] = value;
  }
  settings = { ...settings, ...(changes as Partial<DevSettings>) };
  listeners.forEach((listener) => listener());
}

export function getDevSettings() {
  return settings;
}

export function useDevSettings() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
