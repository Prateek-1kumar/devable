// Tiny module store between the DOM scroll loop and the 3D scene (no React state,
// no three.js). p is the weighted scroll progress, cam the camera's lagging copy.

export const store = { p: 0, cam: 0 };
const listeners = new Set<() => void>();

export function setProgress(p: number, cam: number) {
  if (p === store.p && cam === store.cam) return;
  store.p = p;
  store.cam = cam;
  listeners.forEach((fn) => fn());
}

export function onChange(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** DOM callouts pinned to 3D points, by name ("tool", "devable"). */
export const anchors = new Map<string, HTMLElement>();
