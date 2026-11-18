# Connecting the Language setting to a Next.js app's copy

The panel's Language control sets the `language` dev setting: in the client context (`useDevSettings()`) and in the cookie for the server (`await getDevSettings()`). Changing it refreshes the server components in the frame. The copy only changes if whatever renders it follows that value.

Find out what the app uses: check `package.json` for `next-intl`, `react-i18next`/`i18next`, `@lingui/*` or `react-intl`, look for `messages/`, `locales/`, `dictionaries/` or `i18n/`, and check whether routes sit under `app/[locale]/`.

In every case, make the `language` options in `devSettings.ts` exactly the languages the app has copy for, using the same codes the app uses (`'en'`, or `'en-GB'` if that's how its messages are keyed).

## A. next-intl without locale routing (no `[locale]` segment)

The locale comes from `i18n/request.ts` (`getRequestConfig`). Make it use the dev setting:

```ts
import { getRequestConfig } from 'next-intl/server';
import { getDevSettings } from '@/prototype-preview/devSettings.server';

export default getRequestConfig(async () => {
  const { language: locale } = await getDevSettings();
  return { locale, messages: (await import(`../messages/${locale}.json`)).default };
});
```

If it currently reads the locale from somewhere else (a user cookie, `Accept-Language`), keep that as the fallback for when nobody has picked one in the preview. Read the dev setting only when its cookie is present: check `(await cookies()).has(DEV_SETTINGS_COOKIE)`.

`NextIntlClientProvider` in the layout passes the locale to client components. The refresh after a change re-renders it, so client and server copy both follow.

## B. Locale-prefixed routes (`app/[locale]/…`, next-intl routing or hand-rolled)

Here the URL decides the language, so the setting has to change the URL. Add a small client component inside the root layout's `DevSettingsProvider`:

```tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useDevSettings } from '@/prototype-preview/DevSettingsProvider';
import { isEmbeddedInPreview } from '@/prototype-preview/previewBridge';

const LOCALES = ['en', 'fr', 'de'];

// Inside the preview, keeps the URL's locale prefix in step with the Language setting.
export function PreviewLocaleSync() {
  const { language } = useDevSettings();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (!isEmbeddedInPreview()) return;
    const [, first, ...rest] = pathname.split('/');
    if (!LOCALES.includes(first) || first === language) return;
    router.replace(`/${[language, ...rest].join('/')}`);
  }, [language, pathname, router]);
  return null;
}
```

Use the app's real locale list (import it from its routing config if there is one). Make `startPath` in `previewConfig.ts` and the canvas step hrefs locale-free (`/products`) if the middleware redirects them to the default locale, or prefixed with the default (`/en/products`) if it doesn't.

## C. Dictionary files (`getDictionary(locale)`, the Next.js docs pattern)

Wherever the page or layout picks the locale, use the dev setting:

```ts
const { language } = await getDevSettings();
const dict = await getDictionary(language);
```

If it's taken from `params.locale` (locale routing), use section B instead.

## D. react-i18next / i18next (client-side)

Make the setting drive i18next in a client component inside the provider:

```tsx
const { language } = useDevSettings();
useEffect(() => {
  if (i18n.language !== language) i18n.changeLanguage(language);
}, [language]);
```

If i18next also renders on the server (via `initReactI18next` with server-side resources), initialise it there with `(await getDevSettings()).language`, so the first render matches.

## E. No i18n yet

Keep it small and server-friendly:

1. `messages/en.ts` exports an object of strings grouped by page (`'home.title': 'Fresh from the neighbourhood'`) and `type MessageKey = keyof typeof en`. Each other language file is `export const fr = { … } satisfies Record<MessageKey, string>;`, so a missing key is a type error.
2. A `getMessages(language)` helper that returns `t(key, params)`, plus `Intl.NumberFormat`/`Intl.DateTimeFormat` for that language's locale. Server components call it with `(await getDevSettings()).language`; client components call it with `useDevSettings().language`.
3. Replace the user-facing strings in the pages with `t()` calls. Keep sentences whole, with `{placeholders}` for values, so other languages can reorder words.
4. Format money with `Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })`. Without `narrowSymbol`, a currency foreign to the locale gets a disambiguated symbol, such as "12,95 £GB" in French.
5. Write the translations if the user asked for those languages, and say they're machine-drafted and need a native speaker's check.

Set `<html lang={language}>` in the root layout from the same setting.

## Check

Switch language in the panel and confirm, without reloading the preview:
- copy changes in both server-rendered and client-rendered parts of the current page, and on pages you navigate to,
- numbers, money and dates use that language's format,
- long translations (German is a good test) don't break the layout at the Mobile viewport. If they do, tell the user; that's a real finding the preview is for.
