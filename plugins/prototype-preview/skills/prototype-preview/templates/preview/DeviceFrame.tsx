import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { StatusBarStyle } from './previewBridge';
import { previewColors, previewText } from './previewTheme';

// Phone frames for the web preview: the prototype and the canvas both draw the app inside one.
// Sizes are in points, as the app sees them. Add a device by adding an entry to DEVICES.

export type Device = {
  id: string;
  name: string;
  // Screen size in points, as the app sees it.
  width: number;
  height: number;
  // Space for the status bar and home indicator, drawn by the frame rather than the app.
  top: number;
  bottom: number;
  // Frame thickness at the sides, and at the top and bottom where that differs (iPhone SE).
  bezel: number;
  chin?: number;
  radius: number;
  screenRadius: number;
  cutout: 'island' | 'punch-hole' | 'none';
  platform: 'ios' | 'android';
};

export const DEVICES: Device[] = [
  {
    id: 'iphone-17-pro',
    name: 'iPhone 17 Pro',
    width: 402,
    height: 874,
    top: 62,
    bottom: 34,
    bezel: 12,
    radius: 68,
    screenRadius: 56,
    cutout: 'island',
    platform: 'ios',
  },
  {
    id: 'iphone-17-pro-max',
    name: 'iPhone 17 Pro Max',
    width: 440,
    height: 956,
    top: 62,
    bottom: 34,
    bezel: 12,
    radius: 72,
    screenRadius: 60,
    cutout: 'island',
    platform: 'ios',
  },
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    width: 375,
    height: 667,
    top: 20,
    bottom: 0,
    bezel: 18,
    chin: 96,
    radius: 56,
    screenRadius: 0,
    cutout: 'none',
    platform: 'ios',
  },
  {
    id: 'pixel-9',
    name: 'Pixel 9',
    width: 412,
    height: 915,
    top: 40,
    bottom: 24,
    bezel: 10,
    radius: 48,
    screenRadius: 40,
    cutout: 'punch-hole',
    platform: 'android',
  },
];

export const DEFAULT_DEVICE = DEVICES[0];

export function DeviceFrame({
  device,
  statusBarStyle,
  children,
}: {
  device: Device;
  statusBarStyle: StatusBarStyle;
  children: ReactNode;
}) {
  const chin = device.chin ?? device.bezel;
  return (
    <View
      style={[
        styles.frame,
        {
          paddingHorizontal: device.bezel,
          paddingVertical: chin,
          borderRadius: device.radius,
        },
      ]}>
      <View
        style={[styles.screen, { width: device.width, height: device.height, borderRadius: device.screenRadius }]}>
        {children}
        {/* Drawn over the prototype, like the system UI on a phone; clicks pass through. */}
        <StatusBar device={device} light={statusBarStyle === 'light'} />
        {device.bottom > 0 && (
          <View style={[styles.homeArea, { height: device.bottom }]} pointerEvents="none">
            <View style={device.platform === 'ios' ? styles.homeIndicator : styles.gestureBar} />
          </View>
        )}
        {device.cutout === 'island' && <View style={styles.island} />}
        {device.cutout === 'punch-hole' && <View style={styles.punchHole} />}
      </View>
      {/* iPhone SE: earpiece above the screen and a home button below it. */}
      {device.chin !== undefined && (
        <>
          <View style={[styles.earpiece, { top: chin / 2 - 3 }]} />
          <View style={[styles.homeButton, { bottom: chin / 2 - 26 }]} />
        </>
      )}
    </View>
  );
}

// Status bar content only (no background): the prototype's own screen shows through behind it.
function StatusBar({ device, light }: { device: Device; light: boolean }) {
  const ios = device.platform === 'ios';
  const compact = device.top < 30;
  const color = light ? previewColors.surface : previewColors.black;
  return (
    <View
      pointerEvents="none"
      style={[styles.statusBar, { height: device.top, paddingHorizontal: compact ? 8 : ios ? 32 : 20 }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Text style={[styles.time, compact && styles.timeCompact, !ios && styles.timeAndroid, { color }]}>9:41</Text>
      <View style={styles.statusIcons}>
        <View style={styles.signal}>
          {[4, 6, 8, 10].map((h) => (
            <View key={h} style={[styles.signalBar, { height: h, backgroundColor: color }]} />
          ))}
        </View>
        <View style={[styles.battery, light && styles.batteryLight]}>
          <View style={[styles.batteryLevel, { backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: previewColors.frame,
    boxShadow: '0px 30px 60px rgba(14, 15, 12, 0.25), inset 0px 0px 0px 2px ' + previewColors.frameEdge,
  },
  screen: {
    overflow: 'hidden',
    backgroundColor: previewColors.surface,
  },
  statusBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    ...previewText.semiBold,
    fontSize: 17,
    color: previewColors.black,
    marginTop: 4,
  },
  timeCompact: {
    fontSize: 12,
    marginTop: 0,
  },
  timeAndroid: {
    ...previewText.medium,
    fontSize: 14,
    marginTop: 0,
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signal: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  signalBar: {
    width: 3,
    borderRadius: 1,
    backgroundColor: previewColors.black,
  },
  battery: {
    width: 25,
    height: 12,
    padding: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.4)',
  },
  batteryLight: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  batteryLevel: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: previewColors.black,
  },
  homeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  homeIndicator: {
    width: 140,
    height: 5,
    borderRadius: 3,
    backgroundColor: previewColors.black,
  },
  gestureBar: {
    width: 108,
    height: 4,
    borderRadius: 2,
    backgroundColor: previewColors.black,
  },
  island: {
    position: 'absolute',
    top: 11,
    alignSelf: 'center',
    width: 124,
    height: 36,
    borderRadius: 18,
    backgroundColor: previewColors.black,
  },
  punchHole: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: previewColors.black,
  },
  earpiece: {
    position: 'absolute',
    alignSelf: 'center',
    width: 56,
    height: 6,
    borderRadius: 3,
    backgroundColor: previewColors.frameEdge,
  },
  homeButton: {
    position: 'absolute',
    alignSelf: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: previewColors.frameEdge,
  },
});

// Outer size of a device's frame, bezels included.
export function frameSize(device: Device) {
  return { width: device.width + device.bezel * 2, height: device.height + (device.chin ?? device.bezel) * 2 };
}
