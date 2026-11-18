import type { DevSettings } from './devSettings';

// Every step of the prototype, for the preview's canvas, and how the user gets from one to the
// next. Each step opens straight to its route, with sample params where it needs earlier choices.

export type PrototypeStep = {
  id: string;
  title: string;
  // Path the prototype opens, with any params the step needs.
  href: string;
  // Place on the canvas grid. Main flows run left to right along row 0; screens opened off to
  // the side of a step sit below it.
  col: number;
  row: number;
};

export type StepConnection = {
  from: string;
  to: string;
  // What the user does on `from` to get to `to`, shown on the arrow.
  action: string;
};

export type PrototypeFlow = {
  steps: PrototypeStep[];
  connections: StepConnection[];
};

// Which steps exist, and in what order, can depend on the dev settings, like the flows themselves
// (e.g. a setting that swaps two steps).
export function getPrototypeFlow(settings: DevSettings): PrototypeFlow {
  void settings;

  const steps: PrototypeStep[] = [{ id: 'home', title: 'Home', href: '/', col: 0, row: 0 }];

  const connections: StepConnection[] = [];

  return { steps, connections };
}

// The path part of a step's href, to match against the route the prototype reports.
export function stepPathname(step: PrototypeStep) {
  return step.href.split('?')[0];
}
