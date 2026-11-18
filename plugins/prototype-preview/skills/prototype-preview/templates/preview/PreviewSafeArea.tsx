import { usePathname, useSegments } from 'expo-router';
import { type ReactNode, useEffect } from 'react';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getPreviewInsets, reportRoute, reportStatusBarStyle } from './previewBridge';
import { PREVIEW_CONFIG } from './previewConfig';

// Wraps the app's navigator in the root layout. Inside the web preview it gives the app the
// device frame's safe area (the frame draws the status bar and home indicator over the app), and
// tells the preview which status bar style to draw and which route is showing.
// Elsewhere it renders its children unchanged.
export function PreviewSafeArea({ children }: { children: ReactNode }) {
  const previewInsets = getPreviewInsets();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const pathname = usePathname();
  const modalOpen = PREVIEW_CONFIG.modalRoutes.includes(segments[0] ?? '');

  useEffect(() => {
    reportStatusBarStyle(modalOpen ? 'light' : 'dark');
  }, [modalOpen]);

  useEffect(() => {
    reportRoute(pathname);
  }, [pathname]);

  if (!previewInsets) return children;
  return (
    <SafeAreaInsetsContext.Provider value={{ ...insets, top: previewInsets.top, bottom: previewInsets.bottom }}>
      {children}
    </SafeAreaInsetsContext.Provider>
  );
}
