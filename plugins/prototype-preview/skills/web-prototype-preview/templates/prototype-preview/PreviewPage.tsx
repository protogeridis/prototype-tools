'use client';

import { type ComponentType, useEffect, useRef, useState } from 'react';

import { SegmentedControl, Select, TextButton } from './controls';
import { DEFAULT_DEV_SETTINGS } from './devSettings';
import { useDevSettings, useUpdateDevSettings } from './DevSettingsProvider';
import styles from './preview.module.css';
import { DEFAULT_VIEWPORT_ID, FILL_VIEWPORT_ID, PREVIEW_CONFIG, type Viewport, VIEWPORTS } from './previewConfig';
import { PreviewSettings } from './PreviewSettings';
import { usePrototypeFrame } from './usePrototypeFrame';

// The prototype preview: the app running in an iframe of this same site at a chosen viewport size,
// with the dev settings in a side panel. Settings go to the app with postMessage and apply live,
// and server components follow through the settings cookie (see DevSettingsProvider).
// With a `canvas`, a switch at the top also shows every step at once; clicking one opens the
// prototype at that step.

// What the preview gives a canvas view.
export type CanvasViewProps = {
  // The size each step is laid out at.
  viewport: Viewport;
  // Route the prototype is showing, to mark its step.
  currentPathname: string | null;
  // Opens the prototype at a path and switches back to it.
  onOpen: (path: string) => void;
};

type PreviewMode = 'prototype' | 'canvas';

const VIEWS: { value: PreviewMode; label: string }[] = [
  { value: 'prototype', label: 'Prototype' },
  { value: 'canvas', label: 'Canvas' },
];

const VIEWPORT_OPTIONS = [
  ...VIEWPORTS.map((v) => ({ value: v.id, title: `${v.name} · ${v.width} × ${v.height}` })),
  { value: FILL_VIEWPORT_ID, title: 'Fill the window' },
];

// Space the stage keeps around the frame: toolbar above, caption below (see .frameStage).
const FRAME_INSET_X = 64;
const FRAME_INSET_Y = 72 + 24 + 34;

type Saved = { viewport?: string; view?: PreviewMode };

// The preview remembers the chosen viewport and view per browser. Storage can be unavailable
// (private windows, blocked site data), so every access is guarded.
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

export function PreviewPage({ canvas: Canvas }: { canvas?: ComponentType<CanvasViewProps> }) {
  const settings = useDevSettings();
  const updateSettings = useUpdateDevSettings();
  const [viewportId, setViewportId] = useState(DEFAULT_VIEWPORT_ID);
  const [view, setView] = useState<PreviewMode>('prototype');
  const [restored, setRestored] = useState(false);
  // Where the prototype starts: the start path, or the step last picked on the canvas.
  const [startPath, setStartPath] = useState(PREVIEW_CONFIG.startPath);
  const [reloadKey, setReloadKey] = useState(0);
  const [currentPathname, setCurrentPathname] = useState<string | null>(null);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [wide, setWide] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  usePrototypeFrame(iframeRef, settings, setCurrentPathname);

  // Restored after the first render, since the server can't see localStorage.
  useEffect(() => {
    const saved = loadSaved();
    if (saved.viewport) setViewportId(saved.viewport);
    if (Canvas && saved.view === 'canvas') setView('canvas');
    setRestored(true);
  }, [Canvas]);

  useEffect(() => {
    if (restored) save({ viewport: viewportId, view });
  }, [restored, viewportId, view]);

  // Side by side when there's room, otherwise the panel goes under the stage.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 900px)');
    const onChange = () => setWide(query.matches);
    onChange();
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setStage({ width: element.clientWidth, height: element.clientHeight }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const restart = (path: string) => {
    setStartPath(path);
    setReloadKey((k) => k + 1);
  };

  const openPath = (path: string) => {
    restart(path);
    setView('prototype');
  };

  const available = { width: Math.max(stage.width - FRAME_INSET_X, 1), height: Math.max(stage.height - FRAME_INSET_Y, 1) };
  const fill = viewportId === FILL_VIEWPORT_ID;
  const viewport: Viewport = fill
    ? { id: FILL_VIEWPORT_ID, name: 'Window', width: Math.round(available.width), height: Math.round(available.height) }
    : (VIEWPORTS.find((v) => v.id === viewportId) ?? VIEWPORTS[0]);
  const scale = fill ? 1 : Math.min(1, available.width / viewport.width, available.height / viewport.height);
  const caption = [
    `${viewport.width} × ${viewport.height}`,
    scale < 1 ? `${Math.round(scale * 100)}%` : null,
    currentPathname,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className={wide ? styles.root : `${styles.root} ${styles.narrow}`}>
      <div className={styles.stage} ref={stageRef}>
        {Canvas && view === 'canvas' && (
          <Canvas viewport={viewport} currentPathname={currentPathname} onOpen={openPath} />
        )}
        {/* Stays mounted under the canvas, so switching back finds the prototype where it was. */}
        <div className={view === 'canvas' ? `${styles.frameStage} ${styles.hidden}` : styles.frameStage}>
          {stage.width > 0 && (
            <div className={styles.frame} style={{ width: viewport.width * scale, height: viewport.height * scale }}>
              {/* Laid out at full size, then scaled down from the top-left corner. Remounted on a
                  size change or restart, so the app starts fresh at the new size. */}
              <iframe
                key={`${fill ? 'fill' : viewport.id}-${reloadKey}`}
                ref={iframeRef}
                src={startPath}
                title={PREVIEW_CONFIG.title}
                className={styles.frameScaled}
                style={{
                  width: viewport.width,
                  height: viewport.height,
                  transform: `scale(${scale})`,
                  background: PREVIEW_CONFIG.appBackground,
                }}
              />
            </div>
          )}
          <span className={styles.caption}>{caption}</span>
        </div>
        <div className={styles.toolbar}>
          <Select
            variant="pill"
            label="Viewport"
            options={VIEWPORT_OPTIONS}
            value={fill ? FILL_VIEWPORT_ID : viewport.id}
            onChange={setViewportId}
          />
          {Canvas && (
            <div className={styles.viewSwitch}>
              <SegmentedControl
                label="View"
                options={VIEWS}
                value={view}
                onChange={(value) => setView(value as PreviewMode)}
              />
            </div>
          )}
        </div>
      </div>
      <aside className={styles.panelCard}>
        <div className={styles.panel}>
          <div>
            <h1 className={styles.panelTitle}>{PREVIEW_CONFIG.title}</h1>
            <p className={styles.panelSubtitle}>Changes apply to the prototype straight away.</p>
            <div className={styles.actions}>
              <TextButton label="Restart" onClick={() => restart(PREVIEW_CONFIG.startPath)} />
              <TextButton label="Reset settings" onClick={() => updateSettings(DEFAULT_DEV_SETTINGS)} />
              <TextButton
                label="Open in new tab"
                onClick={() => window.open(currentPathname ?? PREVIEW_CONFIG.startPath, '_blank')}
              />
            </div>
          </div>
          <div className={styles.divider} />
          <PreviewSettings settings={settings} onChange={(key, value) => updateSettings({ [key]: value })} />
        </div>
      </aside>
    </div>
  );
}
