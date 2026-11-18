'use client';

import { type RefObject, useEffect, useRef } from 'react';

import type { DevSettings } from './devSettings';
import { PREVIEW_READY, PREVIEW_ROUTE, PREVIEW_SETTINGS } from './previewBridge';

// Keeps the app running in an iframe in step with the preview (see previewBridge.ts): sends it the
// dev settings when it loads and whenever they change. `onRoute`, which should be stable (e.g. a
// state setter), hears each route it shows.
export function usePrototypeFrame(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  settings: DevSettings,
  onRoute?: (pathname: string) => void,
) {
  const latest = useRef(settings);
  latest.current = settings;

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: PREVIEW_SETTINGS, settings }, window.location.origin);
  }, [iframeRef, settings]);

  // The app starts with the settings in the cookie; it gets the current set each time it (re)loads
  // in case they changed since.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      const { type } = event.data ?? {};
      if (type === PREVIEW_READY) {
        iframeRef.current?.contentWindow?.postMessage(
          { type: PREVIEW_SETTINGS, settings: latest.current },
          window.location.origin,
        );
      }
      if (type === PREVIEW_ROUTE && typeof event.data.pathname === 'string') onRoute?.(event.data.pathname);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [iframeRef, onRoute]);
}
