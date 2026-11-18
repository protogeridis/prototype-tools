import { Redirect } from 'expo-router';
import { type ComponentType, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { applyDevSettings, DEFAULT_DEV_SETTINGS, useDevSettings } from './devSettings';
import { DEFAULT_DEVICE, DEVICES, type Device, DeviceFrame, frameSize } from './DeviceFrame';
import { Dropdown } from './Dropdown';
import { PREVIEW_CONFIG } from './previewConfig';
import { PreviewSettings } from './PreviewSettings';
import { previewColors, previewText } from './previewTheme';
import { prototypeSrc, usePrototypeFrame } from './usePrototypeFrame';
import { SegmentedControl } from './SegmentedControl';
import { TextButton } from './TextButton';

// Web-only prototype preview: the app running in a device frame, with the dev settings in a side
// panel. The prototype runs in an iframe of this same site ("/"); settings are sent to it with
// postMessage (see previewBridge.ts) and apply live, without reloading.
// With a `canvas`, a switch at the top also shows every step at once; clicking one opens the
// prototype at that step.

// What the preview gives a canvas view.
export type CanvasViewProps = {
  device: Device;
  // Route the prototype is showing, to mark its step.
  currentPathname: string | null;
  // Opens the prototype at a path and switches back to it.
  onOpen: (path: string) => void;
  // Space at the top taken by the floating toolbar, to keep clear.
  insetTop: number;
};

type PreviewMode = 'prototype' | 'canvas';

const VIEWS: { value: PreviewMode; label: string }[] = [
  { value: 'prototype', label: 'Prototype' },
  { value: 'canvas', label: 'Canvas' },
];

const PANEL_WIDTH = 360;
// Gap between the floating panel and the edges of the window.
const PANEL_MARGIN = 16;
const STAGE_PADDING = 32;
// The toolbar floats over the top of the stage: view switch centred, device picker at the left.
const TOOLBAR_HEIGHT = 40;
const TOOLBAR_SPACE = PANEL_MARGIN + TOOLBAR_HEIGHT;
// Height taken by the toolbar above the frame and the caption below it.
const STAGE_CHROME = TOOLBAR_SPACE + 22 + 12;

type Saved = { device?: string; view?: PreviewMode; settings?: unknown };

// The preview remembers the chosen device, view and settings per browser. Storage can be
// unavailable (private windows, blocked site data), so every access is guarded.
function loadSaved(): Saved {
  try {
    return JSON.parse(window.localStorage.getItem(PREVIEW_CONFIG.storageKey) ?? '{}');
  } catch {
    return {};
  }
}

function save(value: Saved) {
  try {
    window.localStorage.setItem(PREVIEW_CONFIG.storageKey, JSON.stringify(value));
  } catch {
    // Not saved; the preview still works for this visit.
  }
}

// The /preview route renders this. On native it goes to the app instead.
export function PreviewPage({ canvas }: { canvas?: ComponentType<CanvasViewProps> }) {
  if (Platform.OS !== 'web') return <Redirect href="/" />;
  return <Preview Canvas={canvas} />;
}

function Preview({ Canvas }: { Canvas?: ComponentType<CanvasViewProps> }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [deviceId, setDeviceId] = useState(() => loadSaved().device ?? DEFAULT_DEVICE.id);
  const [view, setView] = useState<PreviewMode>(() =>
    Canvas && loadSaved().view === 'canvas' ? 'canvas' : 'prototype',
  );
  // Where the prototype starts: Home, or the step last picked on the canvas.
  const [startPath, setStartPath] = useState('/');
  const [reloadKey, setReloadKey] = useState(0);
  const [currentPathname, setCurrentPathname] = useState<string | null>(null);
  const settings = useDevSettings();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const statusBarStyle = usePrototypeFrame(iframeRef, setCurrentPathname);
  const device = DEVICES.find((d) => d.id === deviceId) ?? DEFAULT_DEVICE;

  // Restore saved settings once, on first load.
  useEffect(() => {
    applyDevSettings(loadSaved().settings);
  }, []);

  useEffect(() => {
    save({ device: deviceId, view, settings });
  }, [settings, deviceId, view]);

  const restart = (path: string) => {
    setStartPath(path);
    setReloadKey((k) => k + 1);
  };

  const openPath = (path: string) => {
    restart(path);
    setView('prototype');
  };

  // Side by side when there's room, otherwise the panel goes under the device.
  const wide = windowWidth >= 900;
  const stageWidth = wide ? windowWidth - PANEL_WIDTH - PANEL_MARGIN : windowWidth;
  const stageHeight = wide ? windowHeight : Math.max(windowHeight * 0.85, 480);
  const { width: frameWidth, height: frameHeight } = frameSize(device);
  const scale = Math.min(
    1,
    (stageWidth - STAGE_PADDING * 2) / frameWidth,
    (stageHeight - STAGE_PADDING * 2 - STAGE_CHROME) / frameHeight,
  );

  const toolbar = (
    <View style={styles.toolbar} pointerEvents="box-none">
      {Canvas && (
        <View style={styles.viewSwitchRow} pointerEvents="box-none">
          <View style={styles.viewSwitch}>
            <SegmentedControl
              accessibilityLabel="View"
              options={VIEWS}
              value={view}
              onChange={(value) => setView(value as PreviewMode)}
            />
          </View>
        </View>
      )}
      <Dropdown
        variant="pill"
        menuAlign="start"
        accessibilityLabel="Device"
        options={DEVICES.map((d) => ({ value: d.id, title: d.name, detail: `${d.width} × ${d.height} pt` }))}
        value={device.id}
        onChange={setDeviceId}
      />
    </View>
  );

  const stage = (
    <View style={[styles.stage, { width: stageWidth, height: stageHeight }]}>
      {Canvas && view === 'canvas' && (
        <Canvas device={device} currentPathname={currentPathname} onOpen={openPath} insetTop={TOOLBAR_SPACE} />
      )}
      {/* Stays mounted under the canvas, so switching back finds the prototype where it was. */}
      <View style={[styles.deviceStage, view === 'canvas' && styles.hidden]}>
        <View style={{ width: frameWidth * scale, height: frameHeight * scale }}>
          {/* Laid out at full size, then scaled down from the top-left corner into the box above. */}
          <View style={[styles.scaled, { width: frameWidth, height: frameHeight, transform: [{ scale }] }]}>
            <DeviceFrame device={device} statusBarStyle={statusBarStyle}>
              {/* Remounted on device change or reload, so the app lays out for the new screen. It
                  fills the whole screen, under the status bar and home indicator, and gets the
                  safe area to keep its content clear of them. */}
              <iframe
                key={`${device.id}-${reloadKey}`}
                ref={iframeRef}
                src={prototypeSrc(startPath, device)}
                title={PREVIEW_CONFIG.title}
                style={{
                  display: 'block',
                  width: device.width,
                  height: device.height,
                  border: 0,
                  backgroundColor: PREVIEW_CONFIG.appBackground,
                }}
              />
            </DeviceFrame>
          </View>
        </View>
        <Text style={styles.stageCaption}>{`${device.width} × ${device.height} pt${
          scale < 1 ? ` · ${Math.round(scale * 100)}%` : ''
        }`}</Text>
      </View>
      {toolbar}
    </View>
  );

  const panel = (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle} accessibilityRole="header">
          {PREVIEW_CONFIG.title}
        </Text>
        <Text style={styles.panelSubtitle}>Changes apply to the prototype straight away.</Text>
        <View style={styles.actions}>
          <TextButton label="Restart from Home" onPress={() => restart('/')} />
          <TextButton label="Reset settings" onPress={() => applyDevSettings(DEFAULT_DEV_SETTINGS)} />
          <TextButton label="Open in new tab" onPress={() => window.open('/', '_blank')} />
        </View>
      </View>
      <View style={styles.divider} />
      <PreviewSettings settings={settings} onChange={(key, value) => applyDevSettings({ [key]: value })} />
    </View>
  );

  if (wide) {
    return (
      <View style={styles.page}>
        {stage}
        <View style={styles.panelCard}>
          <ScrollView contentContainerStyle={styles.panelContent}>{panel}</ScrollView>
        </View>
      </View>
    );
  }
  return (
    <ScrollView style={styles.pageNarrow} contentContainerStyle={styles.panelContentNarrow}>
      {stage}
      <View style={[styles.panelCard, styles.panelCardNarrow]}>
        <View style={styles.panelContent}>{panel}</View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: previewColors.page,
  },
  pageNarrow: {
    flex: 1,
    backgroundColor: previewColors.page,
  },
  stage: {
    overflow: 'hidden',
  },
  deviceStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: TOOLBAR_SPACE,
  },
  hidden: {
    display: 'none',
  },
  // Over the frame or canvas, so the device menu opens on top of them.
  toolbar: {
    position: 'absolute',
    top: PANEL_MARGIN,
    left: PANEL_MARGIN,
    right: PANEL_MARGIN,
    height: TOOLBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  viewSwitchRow: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewSwitch: {
    width: 200,
  },
  scaled: {
    transformOrigin: 'top left',
  },
  stageCaption: {
    ...previewText.body,
    color: previewColors.textTertiary,
  },
  // Floating, rounded panel with a soft shadow, inset from the window edges.
  panelCard: {
    width: PANEL_WIDTH,
    marginVertical: PANEL_MARGIN,
    marginRight: PANEL_MARGIN,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: previewColors.surface,
    boxShadow: '0px 12px 40px rgba(14, 15, 12, 0.10), 0px 2px 6px rgba(14, 15, 12, 0.06)',
  },
  panelCardNarrow: {
    width: 'auto',
    marginTop: 0,
    marginLeft: PANEL_MARGIN,
  },
  panelContent: {
    padding: 24,
  },
  panelContentNarrow: {
    paddingBottom: PANEL_MARGIN,
  },
  panel: {
    gap: 24,
  },
  divider: {
    height: 1,
    backgroundColor: previewColors.border,
  },
  panelHeader: {
    gap: 4,
  },
  panelTitle: {
    ...previewText.title,
    color: previewColors.black,
  },
  panelSubtitle: {
    ...previewText.body,
    color: previewColors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginLeft: -8,
  },
});
