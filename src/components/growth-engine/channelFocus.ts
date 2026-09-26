// Tiny shared store: which channel the page is pointing at from outside the 3D
// (e.g. the hero's channel keys). The scene lifts and lights that layer.
let focused: number | null = null;
const listeners = new Set<() => void>();

export const channelFocus = {
  get: () => focused,
  set(index: number | null) {
    if (index === focused) return;
    focused = index;
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
