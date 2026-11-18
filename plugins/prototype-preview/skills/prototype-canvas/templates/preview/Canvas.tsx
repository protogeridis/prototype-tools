import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDevSettings } from './devSettings';
import { type Device, DeviceFrame, frameSize } from './DeviceFrame';
import { MinusIcon, PlusIcon } from './icons';
import type { CanvasViewProps } from './PreviewPage';
import { PREVIEW_CONFIG } from './previewConfig';
import { previewColors, previewText } from './previewTheme';
import { getPrototypeFlow, type PrototypeFlow, type PrototypeStep, type StepConnection, stepPathname } from './steps';
import { prototypeSrc, usePrototypeFrame } from './usePrototypeFrame';

// The board is laid out in "world" units, then panned and zoomed as a whole. Steps are drawn at
// half the device's size, so 100% zoom on the board is 50% of the real phone.
const NODE_SCALE = 0.5;
const CARD_PADDING = 12;
const LABEL_GAP = 10;
const LABEL_HEIGHT = 20;
// Space between steps, wide enough for an action label on the arrow.
const GAP_X = 200;
const GAP_Y = 150;
const BOARD_MARGIN = 40;
// Arrows stop short of the card so their heads don't touch it.
const ARROW_GAP = 6;
const CORNER = 14;
const ACTION_WIDTH = 168;

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;
const ZOOM_STEP = 1.25;
// Movement before a press on the board counts as a drag rather than a click on a step.
const DRAG_THRESHOLD = 4;
const DOT_SPACING = 24;
// Space at the bottom taken by the zoom controls, kept clear when fitting the board.
const CONTROLS_SPACE = 64;

type Camera = { x: number; y: number; zoom: number };
type Box = { x: number; y: number; width: number; height: number };

// An open-ended board with every step of the prototype, connected by arrows labelled with what
// the user does to move between them. Each step is the real app, opened at that step in its own
// frame and kept in step with the dev settings. Drag to pan; scroll to pan, or pinch / ⌘-scroll
// to zoom. Clicking a step opens it in the prototype. Steps and arrows come from steps.ts.
// Passed to the preview as <PreviewPage canvas={Canvas} />.
export function Canvas({ device, currentPathname, onOpen, insetTop }: CanvasViewProps) {
  const settings = useDevSettings();
  const flow = useMemo(() => getPrototypeFlow(settings), [settings]);
  const layout = useMemo(() => layoutBoard(flow, device), [flow, device]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const camera = useRef<Camera>({ x: 0, y: 0, zoom: 1 });
  const dragged = useRef(false);
  const [zoomPercent, setZoomPercent] = useState(100);

  // The camera moves on every pointer and wheel event, so it's applied straight to the DOM
  // rather than through React state; only the zoom readout re-renders.
  const apply = useCallback((next: Camera) => {
    camera.current = next;
    const world = worldRef.current;
    const viewport = viewportRef.current;
    if (!world || !viewport) return;
    world.style.transform = `translate(${next.x}px, ${next.y}px) scale(${next.zoom})`;
    viewport.style.backgroundPosition = `${next.x}px ${next.y}px`;
    viewport.style.backgroundSize = `${DOT_SPACING * next.zoom}px ${DOT_SPACING * next.zoom}px`;
    setZoomPercent(Math.round(next.zoom * 100));
  }, []);

  // Zooms keeping the board point under (px, py) — viewport coordinates — where it is.
  const zoomAt = useCallback(
    (zoom: number, px: number, py: number) => {
      const { x, y, zoom: current } = camera.current;
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
      apply({ zoom: next, x: px - ((px - x) / current) * next, y: py - ((py - y) / current) * next });
    },
    [apply],
  );

  const zoomFromCentre = (factor: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    zoomAt(camera.current.zoom * factor, viewport.clientWidth / 2, viewport.clientHeight / 2);
  };

  // Whole board in view, centred between the toolbar and the zoom controls, never above 100%.
  const fit = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const width = viewport.clientWidth;
    const height = viewport.clientHeight - insetTop - CONTROLS_SPACE;
    const zoom = Math.max(MIN_ZOOM, Math.min(1, width / layout.width, height / layout.height));
    apply({
      zoom,
      x: (width - layout.width * zoom) / 2,
      y: insetTop + (height - layout.height * zoom) / 2,
    });
  }, [apply, insetTop, layout]);

  // Fit when the board first shows, and again whenever its layout changes (device, settings).
  useEffect(() => {
    fit();
  }, [fit]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      // Trackpad pinches arrive as wheel events with ctrlKey set.
      if (event.ctrlKey || event.metaKey) {
        zoomAt(camera.current.zoom * Math.exp(-event.deltaY * 0.01), event.clientX - rect.left, event.clientY - rect.top);
      } else {
        const { x, y, zoom } = camera.current;
        apply({ zoom, x: x - event.deltaX, y: y - event.deltaY });
      }
    };

    // Safari reports trackpad pinches as gesture events instead.
    let gestureStartZoom = 1;
    const onGestureStart = (event: Event) => {
      event.preventDefault();
      gestureStartZoom = camera.current.zoom;
    };
    const onGestureChange = (event: Event) => {
      event.preventDefault();
      const { scale, clientX, clientY } = event as Event & { scale: number; clientX: number; clientY: number };
      const rect = viewport.getBoundingClientRect();
      zoomAt(gestureStartZoom * scale, clientX - rect.left, clientY - rect.top);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      dragged.current = false;
      const start = { px: event.clientX, py: event.clientY, ...camera.current };
      const onMove = (move: PointerEvent) => {
        const dx = move.clientX - start.px;
        const dy = move.clientY - start.py;
        if (!dragged.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        dragged.current = true;
        viewport.style.cursor = 'grabbing';
        apply({ zoom: start.zoom, x: start.x + dx, y: start.y + dy });
      };
      const onUp = () => {
        viewport.style.cursor = '';
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    viewport.addEventListener('wheel', onWheel, { passive: false });
    viewport.addEventListener('gesturestart', onGestureStart);
    viewport.addEventListener('gesturechange', onGestureChange);
    viewport.addEventListener('pointerdown', onPointerDown);
    return () => {
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('gesturestart', onGestureStart);
      viewport.removeEventListener('gesturechange', onGestureChange);
      viewport.removeEventListener('pointerdown', onPointerDown);
    };
  }, [apply, zoomAt]);

  return (
    <View style={styles.canvas}>
      <div ref={viewportRef} style={viewportStyle}>
        <div ref={worldRef} style={{ ...worldStyle, width: layout.width, height: layout.height }}>
          <Connectors layout={layout} />
          {flow.steps.map((step) => {
            const box = layout.boxes[step.id];
            return (
              <View key={step.id} style={[styles.node, { left: box.x, top: box.y }]}>
                <StepCard
                  step={step}
                  device={device}
                  current={currentPathname === stepPathname(step)}
                  onPress={() => {
                    // A press that turned into a pan doesn't open the step.
                    if (!dragged.current) onOpen(step.href);
                  }}
                />
              </View>
            );
          })}
        </div>
      </div>
      <View style={styles.controls}>
        <View style={styles.zoomControls}>
          <ControlButton label="Zoom out" onPress={() => zoomFromCentre(1 / ZOOM_STEP)}>
            <MinusIcon />
          </ControlButton>
          <Text style={styles.zoomValue}>{`${zoomPercent}%`}</Text>
          <ControlButton label="Zoom in" onPress={() => zoomFromCentre(ZOOM_STEP)}>
            <PlusIcon />
          </ControlButton>
          <View style={styles.controlDivider} />
          <ControlButton label="Fit to screen" onPress={fit}>
            <Text style={styles.fitLabel}>Fit</Text>
          </ControlButton>
        </View>
        <Text style={styles.hint}>Drag to pan · Pinch or ⌘-scroll to zoom · Click a step to open it</Text>
      </View>
    </View>
  );
}

function ControlButton({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ hovered }) => [styles.controlButton, hovered && styles.controlButtonHover]}>
      {children}
    </Pressable>
  );
}

function StepCard({
  step,
  device,
  current,
  onPress,
}: {
  step: PrototypeStep;
  device: Device;
  current: boolean;
  onPress: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const statusBarStyle = usePrototypeFrame(iframeRef);
  const frame = frameSize(device);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${step.title} in the prototype`}
      onPress={onPress}
      style={({ hovered }) => [styles.card, hovered && styles.cardHover, current && styles.cardCurrent]}>
      <View style={{ width: frame.width * NODE_SCALE, height: frame.height * NODE_SCALE }}>
        {/* Laid out at full size, then scaled down from the top-left corner. The app inside
            can't be clicked: the whole card opens the step instead. */}
        <View
          pointerEvents="none"
          style={[styles.scaled, { width: frame.width, height: frame.height, transform: [{ scale: NODE_SCALE }] }]}>
          <DeviceFrame device={device} statusBarStyle={statusBarStyle}>
            <iframe
              ref={iframeRef}
              src={prototypeSrc(step.href, device)}
              title={step.title}
              tabIndex={-1}
              style={{
                display: 'block',
                width: device.width,
                height: device.height,
                border: 0,
                pointerEvents: 'none',
                backgroundColor: PREVIEW_CONFIG.appBackground,
              }}
            />
          </DeviceFrame>
        </View>
      </View>
      <View style={[styles.label, { width: frame.width * NODE_SCALE }]}>
        <Text style={styles.title} numberOfLines={1}>
          {step.title}
        </Text>
        {current && <Text style={styles.currentBadge}>Open</Text>}
      </View>
    </Pressable>
  );
}

type Edge = { connection: StepConnection; path: string; labelX: number; labelY: number };
type BoardLayout = { width: number; height: number; boxes: Record<string, Box>; edges: Edge[] };

// Places the steps on a grid and routes an arrow for each connection:
//   along a row: straight across, between the frames' middles;
//   down to a later row: out of the bottom, along the gap between the rows, then down into the
//   top. Leaving towards a step in another column, the arrow starts off-centre on that side, so
//   it doesn't share a line with one going straight down.
function layoutBoard(flow: PrototypeFlow, device: Device): BoardLayout {
  const frame = frameSize(device);
  const frameHeight = frame.height * NODE_SCALE;
  const cardWidth = frame.width * NODE_SCALE + CARD_PADDING * 2;
  const cardHeight = frameHeight + CARD_PADDING * 2 + LABEL_GAP + LABEL_HEIGHT;

  const boxes: Record<string, Box> = {};
  let width = 0;
  let height = 0;
  for (const step of flow.steps) {
    const box = {
      x: BOARD_MARGIN + step.col * (cardWidth + GAP_X),
      y: BOARD_MARGIN + step.row * (cardHeight + GAP_Y),
      width: cardWidth,
      height: cardHeight,
    };
    boxes[step.id] = box;
    width = Math.max(width, box.x + box.width + BOARD_MARGIN);
    height = Math.max(height, box.y + box.height + BOARD_MARGIN);
  }

  const edges: Edge[] = [];
  for (const connection of flow.connections) {
    const from = boxes[connection.from];
    const to = boxes[connection.to];
    if (!from || !to) continue;

    if (to.y === from.y) {
      const y = from.y + CARD_PADDING + frameHeight / 2;
      const x1 = from.x + from.width;
      const x2 = to.x - ARROW_GAP;
      edges.push({ connection, path: `M ${x1} ${y} H ${x2}`, labelX: (x1 + x2) / 2, labelY: y });
      continue;
    }

    const toX = to.x + to.width / 2;
    const side = Math.sign(toX - (from.x + from.width / 2));
    const fromX = from.x + from.width / 2 + (side * from.width) / 4;
    const y1 = from.y + from.height;
    const y2 = to.y - ARROW_GAP;
    const laneY = y1 + GAP_Y / 2;
    if (side === 0) {
      edges.push({ connection, path: `M ${fromX} ${y1} V ${y2}`, labelX: fromX, labelY: laneY });
      continue;
    }
    // Rounded corners where the arrow turns.
    const path = [
      `M ${fromX} ${y1}`,
      `V ${laneY - CORNER}`,
      `Q ${fromX} ${laneY} ${fromX + side * CORNER} ${laneY}`,
      `H ${toX - side * CORNER}`,
      `Q ${toX} ${laneY} ${toX} ${laneY + CORNER}`,
      `V ${y2}`,
    ].join(' ');
    edges.push({ connection, path, labelX: (fromX + toX) / 2, labelY: laneY });
  }

  return { width, height, boxes, edges };
}

function Connectors({ layout }: { layout: BoardLayout }) {
  return (
    <>
      <svg
        width={layout.width}
        height={layout.height}
        style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}
        aria-hidden>
        <defs>
          <marker
            id="canvas-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="9"
            markerHeight="9"
            markerUnits="userSpaceOnUse"
            orient="auto">
            <path d="M 1 1 L 9 5 L 1 9" fill="none" stroke={ARROW_COLOR} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>
        {layout.edges.map(({ connection, path }) => (
          <path
            key={`${connection.from}-${connection.to}`}
            d={path}
            fill="none"
            stroke={ARROW_COLOR}
            strokeWidth={1.75}
            markerEnd="url(#canvas-arrow)"
          />
        ))}
      </svg>
      {/* Centred on the arrow, covering the line behind it. */}
      {layout.edges.map(({ connection, labelX, labelY }) => (
        <View
          key={`${connection.from}-${connection.to}-label`}
          pointerEvents="none"
          style={[styles.actionWrap, { left: labelX - ACTION_WIDTH / 2, top: labelY }]}>
          <Text style={styles.action}>{connection.action}</Text>
        </View>
      ))}
    </>
  );
}

const ARROW_COLOR = '#8A8C88';


// Plain DOM elements, so the camera can move them directly (see `apply`). The board shows a dot
// grid that pans and zooms with it.
const viewportStyle = {
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  cursor: 'grab',
  touchAction: 'none',
  userSelect: 'none',
  backgroundImage: 'radial-gradient(circle, rgba(14, 15, 12, 0.14) 1px, transparent 1.2px)',
} as const;

const worldStyle = {
  position: 'absolute',
  left: 0,
  top: 0,
  transformOrigin: '0 0',
} as const;

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    alignSelf: 'stretch',
  },
  node: {
    position: 'absolute',
  },
  card: {
    padding: CARD_PADDING - 2,
    gap: LABEL_GAP,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    cursor: 'pointer',
  },
  cardHover: {
    backgroundColor: 'rgba(14, 15, 12, 0.05)',
  },
  cardCurrent: {
    borderColor: previewColors.accent,
  },
  scaled: {
    transformOrigin: 'top left',
  },
  label: {
    height: LABEL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...previewText.bodyBold,
    flexShrink: 1,
    color: previewColors.text,
  },
  currentBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: previewColors.accent,
    ...previewText.semiBold,
    fontSize: 12,
    lineHeight: 20,
    color: previewColors.onAccent,
  },
  actionWrap: {
    position: 'absolute',
    width: ACTION_WIDTH,
    alignItems: 'center',
    transform: [{ translateY: '-50%' }],
  },
  action: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: previewColors.surface,
    boxShadow: 'inset 0px 0px 0px 1px rgba(14, 15, 12, 0.12)',
    ...previewText.medium,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    color: previewColors.textSecondary,
  },
  controls: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    gap: 2,
    borderRadius: 14,
    backgroundColor: previewColors.surface,
    boxShadow: '0px 4px 16px rgba(14, 15, 12, 0.10), 0px 1px 3px rgba(14, 15, 12, 0.06)',
  },
  controlButton: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  controlButtonHover: {
    backgroundColor: previewColors.track,
  },
  controlDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 2,
    backgroundColor: previewColors.border,
  },
  zoomValue: {
    minWidth: 44,
    ...previewText.medium,
    fontSize: 13,
    textAlign: 'center',
    color: previewColors.text,
  },
  fitLabel: {
    ...previewText.medium,
    fontSize: 13,
    color: previewColors.text,
  },
  // Backed, so it stays readable over the board.
  hint: {
    ...previewText.body,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    color: previewColors.textSecondary,
  },
});
