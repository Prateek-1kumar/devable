"use client";

import { useSyncExternalStore } from "react";
import { labelStore, noLabels, type LabelSpec } from "./label-store";

// The in-scene name tags as HTML over the canvas: quiet mono captions with a soft white halo, crisp at any zoom.
// The story's steps live in the caption card, not in the scene. Tags hide on phones.

export default function Labels() {
  const specs = useSyncExternalStore(
    labelStore.subscribe,
    labelStore.get,
    noLabels,
  );
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
    >
      {specs.map((spec) => (
        <div
          key={spec.key}
          ref={(el) => {
            if (el) labelStore.els.set(spec.key, el);
            else labelStore.els.delete(spec.key);
          }}
          style={{ visibility: "hidden", opacity: 0 }}
          className="absolute top-0 left-0 will-change-transform"
        >
          <Tag spec={spec} />
        </div>
      ))}
    </div>
  );
}

const HALO = {
  textShadow: "0 0 2px #fff, 0 0 6px #fff, 0 0 12px #fff, 0 0 18px #fff",
};

function Tag({ spec }: { spec: LabelSpec }) {
  return (
    <span
      style={HALO}
      className="block font-mono text-[0.66rem] leading-none tracking-[0.14em] whitespace-nowrap text-ink/60 uppercase max-sm:hidden"
    >
      {spec.text}
    </span>
  );
}
