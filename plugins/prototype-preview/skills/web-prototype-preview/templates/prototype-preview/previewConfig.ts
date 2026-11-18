// Per-app settings for the prototype preview (/preview).
export const PREVIEW_CONFIG = {
  // Shown at the top of the side panel, and as the prototype iframe's title.
  title: 'Prototype',
  // localStorage key for the chosen viewport and view.
  storageKey: 'prototype-preview',
  // Where the prototype starts, and where Restart goes.
  startPath: '/',
  // Shown behind the app while it loads; match the app's page background.
  appBackground: '#FFFFFF',
};

export type Viewport = { id: string; name: string; width: number; height: number };

// Sizes the app can be shown at, in CSS pixels. 'fill' uses the whole stage instead.
export const VIEWPORTS: Viewport[] = [
  { id: 'desktop', name: 'Desktop', width: 1440, height: 900 },
  { id: 'laptop', name: 'Laptop', width: 1280, height: 800 },
  { id: 'tablet', name: 'Tablet', width: 768, height: 1024 },
  { id: 'mobile', name: 'Mobile', width: 390, height: 844 },
];

export const FILL_VIEWPORT_ID = 'fill';
export const DEFAULT_VIEWPORT_ID = 'desktop';
