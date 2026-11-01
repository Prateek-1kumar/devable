"use client";

import { useSyncExternalStore } from "react";
import { labelStore, noLabels, type LabelSpec } from "./label-store";

// The in-scene name tags as HTML over the canvas, crisp at any zoom: white pills on short leaders. The story's
// steps live in the caption card, not in the scene. Tags hide on phones.

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

/** A station's name: a white pill with a numbered disc, on a short hairline leader down to a dot on the station. */
function Tag({ spec }: { spec: LabelSpec }) {
  return (
    <span className="flex flex-col items-center max-sm:hidden">
      <span className="flex items-center gap-2 rounded-full border border-line bg-white py-[0.3rem] pr-4 pl-[0.3rem] shadow-[0_10px_28px_-14px_rgb(23_44_33/0.45)]">
        {spec.n && (
          <span className="grid size-[1.6rem] place-items-center rounded-full bg-ink font-mono text-[0.68rem] text-primary">
            {spec.n}
          </span>
        )}
        <span className="text-[0.95rem] leading-none font-medium tracking-[-0.02em] whitespace-nowrap text-ink">
          {spec.text}
        </span>
      </span>
      <span className="h-6 w-px bg-ink/35" />
      <span className="size-2 rounded-full border-[1.5px] border-ink bg-white shadow-[0_0_0_3px_rgb(255_255_255/0.85)]" />
    </span>
  );
}
