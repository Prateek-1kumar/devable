// The band's in-scene name tags, kept free of three.js so the page shell can render them as plain HTML. The
// 3D world publishes its tags here on mount and positions each one every frame (World's projector); the shell
// renders them over the canvas.

export type LabelSpec = {
  key: string;
  /** World point the tag pins to. */
  at: [number, number, number];
  text: string;
  /** Its number, shown in a dark disc before the name. */
  n?: string;
  /** Which side of its point the tag sits: above (default) or below. */
  side?: "up" | "down";
  /** The beat it belongs to and the part of that beat's story it shows from (see `shown`). */
  beat: number;
  from: number;
  to?: number;
};

let specs: LabelSpec[] = [];
const listeners = new Set<() => void>();

export const labelStore = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  },
  get: () => specs,
  set(next: LabelSpec[]) {
    specs = next;
    listeners.forEach((fn) => fn());
  },
  /** The rendered element for each tag, by key, for the projector to move. */
  els: new Map<string, HTMLElement>(),
};

/** Where a tag's box (`w` × `h` px) starts relative to its point: centred above it, or below. */
export const offset = (
  spec: LabelSpec,
  w: number,
  h: number,
): [number, number] => [-w / 2, spec.side === "down" ? 0 : -h];

const EMPTY: LabelSpec[] = [];
export const noLabels = () => EMPTY;
