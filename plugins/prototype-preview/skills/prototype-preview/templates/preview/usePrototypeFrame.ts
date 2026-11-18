import { type RefObject, useCallback, useEffect, useState } from 'react';

import { getDevSettings, useDevSettings } from './devSettings';
import {
  PREVIEW_READY,
  PREVIEW_ROUTE,
  PREVIEW_SETTINGS,
  PREVIEW_STATUS_BAR,
  type StatusBarStyle,
} from './previewBridge';

// Keeps a prototype running in an iframe in step with the preview (see previewBridge.ts): sends it
// the dev settings when it loads and whenever they change, and returns the status bar style it
// asks for. `onRoute`, which should be stable (e.g. a state setter), hears each route it shows.
export function usePrototypeFrame(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  onRoute?: (pathname: string) => void,
): StatusBarStyle {
  const settings = useDevSettings();
  // Light while the prototype shows a modal (dark backdrop behind the status bar), as on iOS.
  const [statusBarStyle, setStatusBarStyle] = useState<StatusBarStyle>('dark');

  const sendSettings = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: PREVIEW_SETTINGS, settings: getDevSettings() },
      window.location.origin,
    );
  }, [iframeRef]);

  useEffect(() => {
    sendSettings();
  }, [settings, sendSettings]);

  // The prototype starts with defaults, so it gets the current set each time it (re)loads.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      const { type } = event.data ?? {};
      if (type === PREVIEW_READY) sendSettings();
      if (type === PREVIEW_STATUS_BAR) setStatusBarStyle(event.data.style === 'light' ? 'light' : 'dark');
      if (type === PREVIEW_ROUTE && typeof event.data.pathname === 'string') onRoute?.(event.data.pathname);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [iframeRef, sendSettings, onRoute]);

  return statusBarStyle;
}

// The prototype's URL for a path, with the device's safe area for it to read (?previewInsets).
export function prototypeSrc(path: string, insets: { top: number; bottom: number }) {
  return `${path}${path.includes('?') ? '&' : '?'}previewInsets=${insets.top},${insets.bottom}`;
}
