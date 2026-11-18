import { Platform } from 'react-native';

import { applyDevSettings } from './devSettings';

// Messages between the web preview (/preview) and the prototype it embeds in an iframe. Both are
// served from the same origin, which is checked on every message.
//   prototype → preview: READY when it loads, so the preview can send the current settings.
//   prototype → preview: STATUS_BAR with 'light' or 'dark' content, like iOS's status bar style.
//   prototype → preview: ROUTE with the current pathname, so the canvas can mark the open step.
//   preview → prototype: SETTINGS with the full set of dev settings to apply.
// The preview also passes the device's safe area in the iframe URL (?previewInsets=top,bottom),
// since it draws the status bar and home indicator over the prototype.
export const PREVIEW_READY = 'prototype-preview:ready';
export const PREVIEW_SETTINGS = 'prototype-preview:settings';
export const PREVIEW_STATUS_BAR = 'prototype-preview:status-bar';
export const PREVIEW_ROUTE = 'prototype-preview:route';

export type StatusBarStyle = 'light' | 'dark';

// True inside the preview's iframe, e.g. to hide an in-app dev menu button there, since the
// preview's side panel has the same settings.
export function isEmbeddedInPreview() {
  return Platform.OS === 'web' && typeof window !== 'undefined' && window.parent !== window;
}

let started = false;

// Called once by the root layout. Only does anything when embedded in the preview.
export function startPreviewBridge() {
  if (started || !isEmbeddedInPreview()) return;
  started = true;
  // Phones don't show scrollbars; desktop browsers would draw them inside the device frame.
  const style = document.createElement('style');
  style.textContent = '* { scrollbar-width: none; } *::-webkit-scrollbar { display: none; }';
  document.head.appendChild(style);
  window.addEventListener('message', (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === PREVIEW_SETTINGS) applyDevSettings(event.data.settings);
  });
  window.parent.postMessage({ type: PREVIEW_READY }, window.location.origin);
}

// The device frame's safe area, when embedded in the preview; null otherwise. Read once, since the
// URL changes as the prototype navigates.
const previewInsets = (() => {
  if (!isEmbeddedInPreview()) return null;
  const value = new URLSearchParams(window.location.search).get('previewInsets');
  const [top, bottom] = (value ?? '').split(',').map(Number);
  return Number.isFinite(top) && Number.isFinite(bottom) ? { top, bottom } : null;
})();

export function getPreviewInsets() {
  return previewInsets;
}

let lastStatusBarStyle: StatusBarStyle | null = null;

export function reportStatusBarStyle(style: StatusBarStyle) {
  if (!isEmbeddedInPreview() || style === lastStatusBarStyle) return;
  lastStatusBarStyle = style;
  window.parent.postMessage({ type: PREVIEW_STATUS_BAR, style }, window.location.origin);
}

export function reportRoute(pathname: string) {
  if (!isEmbeddedInPreview()) return;
  window.parent.postMessage({ type: PREVIEW_ROUTE, pathname }, window.location.origin);
}
