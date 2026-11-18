'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { DevSettings } from './devSettings';
import { useDevSettings } from './DevSettingsProvider';
import styles from './preview.module.css';
import type { CanvasViewProps } from './PreviewPage';
import { PREVIEW_CONFIG, type Viewport } from './previewConfig';
import { getPrototypeFlow, type PrototypeFlow, type PrototypeStep, type StepConnection, stepPathname } from './steps';
import { usePrototypeFrame } from './usePrototypeFrame';

// The board is laid out in "world" units, then panned and zoomed as a whole. Each step is drawn
// at a scale that makes it about CARD_WIDTH wide (at most half size), so desktop and mobile
// viewports both give readable cards.
const CARD_WIDTH = 360;
const MAX_NODE_SCALE = 0.5;
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
const ARROW_COLOR = '#8A8C88';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 2;
const ZOOM_STEP = 1.25;
// Movement before a press on the board counts as a drag rather than a click on a step.
const DRAG_THRESHOLD = 4;
const DOT_SPACING = 24;
// Space taken by the toolbar above and the zoom controls below, kept clear when fitting the board.
const INSET_TOP = 72;
const INSET_BOTTOM = 64;

type Camera = { x: number; y: number; zoom: number };
type Box = { x: number; y: number; width: number; height: number };

// An open-ended board with every step of the prototype, connected by arrows labelled with what
// the user does to move between them. Each step is the real app, opened at that step in its own
// frame and kept in step with the dev settings. Drag to pan; scroll to pan, or pinch / ⌘-scroll
// to zoom. Clicking a step opens it in the prototype. Steps and arrows come from steps.ts.
// Passed to the preview as <PreviewPage canvas={Canvas} />.
export function Canvas({ viewport, currentPathname, onOpen }: CanvasViewProps) {
  const settings = useDevSettings();
  const flow = useMemo(() => getPrototypeFlow(settings), [settings]);
  const layout = useMemo(() => layoutBoard(flow, viewport), [flow, viewport]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const camera = useRef<Camera>({ x: 0, y: 0, zoom: 1 });
  const dragged = useRef(false);
  const [zoomPercent, setZoomPercent] = useState(100);

  // The camera moves on every pointer and wheel event, so it's applied straight to the DOM rather
  // than through React state; only the zoom readout re-renders.
  const apply = useCallback((next: Camera) => {
    camera.current = next;
    const world = worldRef.current;
    const board = viewportRef.current;
    if (!world || !board) return;
    world.style.transform = `translate(${next.x}px, ${next.y}px) scale(${next.zoom})`;
    board.style.backgroundPosition = `${next.x}px ${next.y}px`;
    board.style.backgroundSize = `${DOT_SPACING * next.zoom}px ${DOT_SPACING * next.zoom}px`;
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
    const board = viewportRef.current;
    if (!board) return;
    zoomAt(camera.current.zoom * factor, board.clientWidth / 2, board.clientHeight / 2);
  };

  // Whole board in view, centred between the toolbar and the zoom controls, never above 100%.
  const fit = useCallback(() => {
    const board = viewportRef.current;
    if (!board) return;
    const width = board.clientWidth;
    const height = board.clientHeight - INSET_TOP - INSET_BOTTOM;
    const zoom = Math.max(MIN_ZOOM, Math.min(1, width / layout.width, height / layout.height));
    apply({ zoom, x: (width - layout.width * zoom) / 2, y: INSET_TOP + (height - layout.height * zoom) / 2 });
  }, [apply, layout]);

  // Fit when the board first shows, and again whenever its layout changes (viewport, settings).
  useEffect(() => {
    fit();
  }, [fit]);

  useEffect(() => {
    const board = viewportRef.current;
    if (!board) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = board.getBoundingClientRect();
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
      const rect = board.getBoundingClientRect();
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
        board.style.cursor = 'grabbing';
        apply({ zoom: start.zoom, x: start.x + dx, y: start.y + dy });
      };
      const onUp = () => {
        board.style.cursor = '';
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    board.addEventListener('wheel', onWheel, { passive: false });
    board.addEventListener('gesturestart', onGestureStart);
    board.addEventListener('gesturechange', onGestureChange);
    board.addEventListener('pointerdown', onPointerDown);
    return () => {
      board.removeEventListener('wheel', onWheel);
      board.removeEventListener('gesturestart', onGestureStart);
      board.removeEventListener('gesturechange', onGestureChange);
      board.removeEventListener('pointerdown', onPointerDown);
    };
  }, [apply, zoomAt]);

  return (
    <>
      <div ref={viewportRef} className={styles.canvas}>
        <div ref={worldRef} className={styles.world} style={{ width: layout.width, height: layout.height }}>
          <Connectors layout={layout} />
          {flow.steps.map((step) => {
            const box = layout.boxes[step.id];
            return (
              <StepCard
                key={step.id}
                step={step}
                box={box}
                viewport={viewport}
                nodeScale={layout.nodeScale}
                settings={settings}
                current={currentPathname === stepPathname(step)}
                onOpen={() => {
                  // A press that turned into a pan doesn't open the step.
                  if (!dragged.current) onOpen(step.href);
                }}
              />
            );
          })}
        </div>
      </div>
      <div className={styles.canvasControls}>
        <div className={styles.zoomControls}>
          <button type="button" className={styles.iconButton} aria-label="Zoom out" onClick={() => zoomFromCentre(1 / ZOOM_STEP)}>
            −
          </button>
          <span className={styles.zoomValue}>{`${zoomPercent}%`}</span>
          <button type="button" className={styles.iconButton} aria-label="Zoom in" onClick={() => zoomFromCentre(ZOOM_STEP)}>
            +
          </button>
          <span className={styles.controlDivider} />
          <button type="button" className={styles.iconButton} aria-label="Fit to screen" onClick={fit}>
            Fit
          </button>
        </div>
        <span className={styles.hint}>Drag to pan · Pinch or ⌘-scroll to zoom · Click a step to open it</span>
      </div>
    </>
  );
}

function StepCard({
  step,
  box,
  viewport,
  nodeScale,
  settings,
  current,
  onOpen,
}: {
  step: PrototypeStep;
  box: Box;
  viewport: Viewport;
  nodeScale: number;
  settings: DevSettings;
  current: boolean;
  onOpen: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  usePrototypeFrame(iframeRef, settings);

  return (
    <button
      type="button"
      aria-label={`Open ${step.title} in the prototype`}
      className={current ? `${styles.node} ${styles.nodeCurrent}` : styles.node}
      style={{ left: box.x, top: box.y, width: box.width }}
      onClick={onOpen}>
      <div className={styles.nodeFrame} style={{ width: viewport.width * nodeScale, height: viewport.height * nodeScale }}>
        {/* Laid out at full size, then scaled down from the top-left corner. The app inside can't
            be clicked: the whole card opens the step instead. */}
        <iframe
          src={step.href}
          title={step.title}
          tabIndex={-1}
          style={{
            width: viewport.width,
            height: viewport.height,
            transform: `scale(${nodeScale})`,
            transformOrigin: 'top left',
            background: PREVIEW_CONFIG.appBackground,
          }}
        />
      </div>
      <span className={styles.nodeLabel}>
        <span className={styles.nodeTitle}>{step.title}</span>
        {current && <span className={styles.badge}>Open</span>}
      </span>
    </button>
  );
}

type Edge = { connection: StepConnection; path: string; labelX: number; labelY: number };
type BoardLayout = { width: number; height: number; nodeScale: number; boxes: Record<string, Box>; edges: Edge[] };

// Places the steps on a grid and routes an arrow for each connection:
//   along a row: straight across, between the frames' middles;
//   down to a later row: out of the bottom, along the gap between the rows, then down into the
//   top. Leaving towards a step in another column, the arrow starts off-centre on that side, so
//   it doesn't share a line with one going straight down.
function layoutBoard(flow: PrototypeFlow, viewport: Viewport): BoardLayout {
  const nodeScale = Math.min(MAX_NODE_SCALE, CARD_WIDTH / viewport.width);
  const frameHeight = viewport.height * nodeScale;
  const cardWidth = viewport.width * nodeScale + CARD_PADDING * 2;
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

  return { width, height, nodeScale, boxes, edges };
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
            id="prototype-canvas-arrow"
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
            markerEnd="url(#prototype-canvas-arrow)"
          />
        ))}
      </svg>
      {/* Centred on the arrow, covering the line behind it. */}
      {layout.edges.map(({ connection, labelX, labelY }) => (
        <span key={`${connection.from}-${connection.to}-label`} className={styles.action} style={{ left: labelX, top: labelY }}>
          {connection.action}
        </span>
      ))}
    </>
  );
}
