// Settings for trying out alternatives in the prototype: language, sample data, layout and flow
// variants. Picked in the preview's side panel (/preview) and applied live to the app running in
// its frame.
//
// Shared by server and client code, so nothing here touches React or the browser.
//   Client components: useDevSettings() from ./DevSettingsProvider
//   Server components: await getDevSettings() from ./devSettings.server
// The settings travel in a cookie, so server components render with them too.
//
// To add a setting, add a group below: the panel, the cookie and the types all follow from it.

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
export const DEV_SETTING_LIST: readonly DevSettingGroup[] = DEV_SETTING_GROUPS;

export const DEFAULT_DEV_SETTINGS = Object.fromEntries(
  DEV_SETTING_LIST.map((group) => [group.key, group.options[0].value]),
) as DevSettings;

export const DEV_SETTINGS_COOKIE = 'prototype-preview-settings';

// Applies any valid settings from an untyped source (a message, the cookie) on top of `base`,
// ignoring unknown keys and values.
export function parseDevSettings(input: unknown, base: DevSettings = DEFAULT_DEV_SETTINGS): DevSettings {
  if (!input || typeof input !== 'object') return base;
  const changes: Record<string, string> = {};
  for (const group of DEV_SETTING_LIST) {
    const value = (input as Record<string, unknown>)[group.key];
    if (typeof value === 'string' && group.options.some((o) => o.value === value)) changes[group.key] = value;
  }
  return { ...base, ...(changes as Partial<DevSettings>) };
}

export function sameDevSettings(a: DevSettings, b: DevSettings) {
  return DEV_SETTING_LIST.every((group) => a[group.key as DevSettingKey] === b[group.key as DevSettingKey]);
}

export function decodeDevSettings(cookieValue: string | undefined): DevSettings {
  if (!cookieValue) return DEFAULT_DEV_SETTINGS;
  try {
    return parseDevSettings(JSON.parse(decodeURIComponent(cookieValue)));
  } catch {
    return DEFAULT_DEV_SETTINGS;
  }
}

export function encodeDevSettings(settings: DevSettings) {
  return encodeURIComponent(JSON.stringify(settings));
}
