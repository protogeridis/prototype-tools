// English copy, and the list of every message key. Other languages (fr.ts, de.ts, …) must provide
// every key here: write them as `export const fr = { … } satisfies Record<MessageKey, string>;`.
// Group keys by screen. Placeholders in {braces} are filled in by t().
export const en = {
  'common.close': 'Close',
  'common.back': 'Back',
  'common.continue': 'Continue',
};

export type MessageKey = keyof typeof en;
