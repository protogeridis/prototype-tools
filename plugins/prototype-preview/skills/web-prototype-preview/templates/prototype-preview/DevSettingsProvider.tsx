'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

import {
  DEFAULT_DEV_SETTINGS,
  DEV_SETTINGS_COOKIE,
  type DevSettings,
  encodeDevSettings,
  parseDevSettings,
  sameDevSettings,
} from './devSettings';
import {
  guardPreviewHistory,
  isEmbeddedInPreview,
  PREVIEW_READY,
  PREVIEW_ROUTE,
  PREVIEW_SETTINGS,
  postToPreview,
} from './previewBridge';

type DevSettingsContextValue = {
  settings: DevSettings;
  // Applies any valid settings from an untyped source, ignoring the rest.
  update: (changes: unknown) => void;
};

const DevSettingsContext = createContext<DevSettingsContextValue>({
  settings: DEFAULT_DEV_SETTINGS,
  update: () => {},
});

// Wraps the whole app in the root layout, with the settings read from the cookie on the server,
// so server and client render the same thing on the first load.
// When the settings change it writes them back to the cookie, and, inside the preview's iframe,
// refreshes the server components so they render with them too. Inside the iframe it also hears
// the settings the preview sends, reports the route it shows, and keeps the app's back from
// navigating the preview page itself (see guardPreviewHistory).
export function DevSettingsProvider({ initialSettings, children }: { initialSettings: DevSettings; children: ReactNode }) {
  const [settings, setSettings] = useState(initialSettings);
  const router = useRouter();
  const pathname = usePathname();

  const update = useCallback((changes: unknown) => {
    setSettings((current) => {
      const next = parseDevSettings(changes, current);
      return sameDevSettings(next, current) ? current : next;
    });
  }, []);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.cookie = `${DEV_SETTINGS_COOKIE}=${encodeDevSettings(settings)}; path=/; max-age=31536000; samesite=lax`;
    if (isEmbeddedInPreview()) router.refresh();
  }, [settings, router]);

  useEffect(() => {
    if (!isEmbeddedInPreview()) return;
    guardPreviewHistory();
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (event.data?.type === PREVIEW_SETTINGS) update(event.data.settings);
    };
    window.addEventListener('message', onMessage);
    postToPreview({ type: PREVIEW_READY });
    return () => window.removeEventListener('message', onMessage);
  }, [update]);

  useEffect(() => {
    postToPreview({ type: PREVIEW_ROUTE, pathname });
  }, [pathname]);

  return <DevSettingsContext.Provider value={{ settings, update }}>{children}</DevSettingsContext.Provider>;
}

// The dev settings, for client components: `const { language } = useDevSettings()`.
export function useDevSettings() {
  return useContext(DevSettingsContext).settings;
}

export function useUpdateDevSettings() {
  return useContext(DevSettingsContext).update;
}
