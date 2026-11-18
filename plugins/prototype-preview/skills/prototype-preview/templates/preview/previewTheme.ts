import type { TextStyle } from 'react-native';

// The look of the preview's own chrome (page, panel, toolbar, device frames, canvas). Kept apart
// from the app's theme so the preview works in any project; change the accent and link colours
// to match the brand if you like.

const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export const previewColors = {
  page: '#E8EAE6',
  surface: '#FFFFFF',
  text: '#0E0F0C',
  textSecondary: '#454745',
  textTertiary: '#6A6C6A',
  border: 'rgba(14, 15, 12, 0.12)',
  hover: 'rgba(14, 15, 12, 0.05)',
  track: 'rgba(14, 15, 12, 0.06)',
  // Marks the step that's open on the canvas.
  accent: '#9FE870',
  onAccent: '#163300',
  link: '#163300',
  frame: '#1C1D1B',
  frameEdge: '#3A3B38',
  black: '#000000',
  white: '#FFFFFF',
};

export const previewText = {
  title: { fontFamily: FONT, fontWeight: '600', fontSize: 22, lineHeight: 28, letterSpacing: -0.33 },
  body: { fontFamily: FONT, fontWeight: '400', fontSize: 14, lineHeight: 22, letterSpacing: 0.14 },
  bodyBold: { fontFamily: FONT, fontWeight: '600', fontSize: 14, lineHeight: 22, letterSpacing: 0.175 },
  medium: { fontFamily: FONT, fontWeight: '500' },
  semiBold: { fontFamily: FONT, fontWeight: '600' },
} satisfies Record<string, TextStyle>;
