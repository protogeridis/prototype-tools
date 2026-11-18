// Per-app settings for the web prototype preview (/preview).
export const PREVIEW_CONFIG = {
  // Shown at the top of the side panel, and as the prototype iframe's title.
  title: 'Prototype',
  // localStorage key for the chosen device, view and settings.
  storageKey: 'prototype-preview',
  // First path segment of routes presented as modals (e.g. 'send' for app/send/_layout.tsx shown
  // with presentation: 'modal'). While one is open the frame's status bar switches to light
  // content, as iOS does over a modal's dark backdrop.
  modalRoutes: [] as string[],
  // Shown behind the app while it loads; match the app's screen background.
  appBackground: '#FFFFFF',
};
