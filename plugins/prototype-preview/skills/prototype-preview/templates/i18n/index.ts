import { useMemo } from 'react';

import { type Language, useDevSettings } from '../preview/devSettings';
import { en, type MessageKey } from './en';

// Translations and locale-aware formatting. The language is a dev setting, picked in the web
// preview's side panel. Add a language by adding its messages file and an option to the
// 'language' group in preview/devSettings.ts; the Record types below then ask for it here.

export type { MessageKey };
export type Params = Record<string, string | number>;
export type Translate = (key: MessageKey, params?: Params) => string;

const MESSAGES: Record<Language, Record<MessageKey, string>> = { en };

// The locale each language formats numbers and dates in.
const LOCALES: Record<Language, string> = { en: 'en-GB' };

export type I18n = {
  language: Language;
  locale: string;
  t: Translate;
  // 1862.4 → "1,862.40" / "1 862,40" / "1.862,40"
  formatNumber: (value: number, decimals?: number) => string;
  // "22 Oct", "22 October 2025" (the year only when it isn't this one)
  formatDate: (date: Date, options?: { month?: 'short' | 'long' }) => string;
};

export function createI18n(language: Language): I18n {
  const locale = LOCALES[language];
  const messages = MESSAGES[language];

  // Placeholders in {braces} are filled from params: t('greeting', { name: 'Sam' }).
  const t: Translate = (key, params) => {
    const template = messages[key] ?? en[key];
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
  };

  const numberFormats = new Map<number, Intl.NumberFormat>();
  const formatNumber = (value: number, decimals = 0) => {
    let format = numberFormats.get(decimals);
    if (!format) {
      format = new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      numberFormats.set(decimals, format);
    }
    return format.format(value);
  };

  const formatDate: I18n['formatDate'] = (date, { month = 'short' } = {}) =>
    new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month,
      ...(date.getFullYear() === new Date().getFullYear() ? {} : { year: 'numeric' }),
    }).format(date);

  return { language, locale, t, formatNumber, formatDate };
}

export function useI18n() {
  const { language } = useDevSettings();
  return useMemo(() => createI18n(language), [language]);
}
