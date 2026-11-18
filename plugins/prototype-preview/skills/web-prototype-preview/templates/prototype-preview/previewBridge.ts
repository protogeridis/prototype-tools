// Messages between the preview page (/preview) and the app it embeds in an iframe. Both are
// served from the same origin, which is checked on every message.
//   app → preview: READY when it loads, so the preview can send the current settings.
//   app → preview: ROUTE with the current pathname, so the preview and canvas know where it is.
//   preview → app: SETTINGS with the full set of dev settings to apply.
export const PREVIEW_READY = 'prototype-preview:ready';
export const PREVIEW_SETTINGS = 'prototype-preview:settings';
export const PREVIEW_ROUTE = 'prototype-preview:route';

// True inside the preview's iframe. Only call it in the browser (effects, event handlers).
export function isEmbeddedInPreview() {
  return typeof window !== 'undefined' && window.parent !== window;
}

export function postToPreview(message: { type: string; [key: string]: unknown }) {
  if (!isEmbeddedInPreview()) return;
  window.parent.postMessage(message, window.location.origin);
}

const HISTORY_INDEX = '__prototypePreviewIndex';
let historyGuarded = false;

// In the preview's iframe, the app's history is joined with the preview page's. Going back past
// the page the frame opened on (e.g. a Cancel button calling router.back() on a step opened from
// the canvas) would navigate the preview itself away. This numbers the frame's own history
// entries and ignores going back past the first, as a fresh tab would.
export function guardPreviewHistory() {
  if (historyGuarded || !isEmbeddedInPreview()) return;
  historyGuarded = true;
  const { history } = window;
  const pushState = history.pushState.bind(history);
  const replaceState = history.replaceState.bind(history);
  const back = history.back.bind(history);
  const go = history.go.bind(history);
  let index = 0;

  const withIndex = (state: unknown, value: number) => ({ ...(state as object), [HISTORY_INDEX]: value });

  replaceState(withIndex(history.state, 0), '');
  history.pushState = (state, unused, url) => pushState(withIndex(state, ++index), unused, url);
  history.replaceState = (state, unused, url) => replaceState(withIndex(state, index), unused, url);
  history.back = () => {
    if (index > 0) back();
  };
  history.go = (delta = 0) => {
    if (index + delta >= 0) go(delta);
  };
  window.addEventListener('popstate', (event) => {
    const value = (event.state as Record<string, unknown> | null)?.[HISTORY_INDEX];
    if (typeof value === 'number') index = value;
  });
}
