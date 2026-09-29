"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { channelFocus } from "../growth-engine/channelFocus";
import { CHANNELS } from "../growth-engine/channels";
import type { LabelId } from "./timeline";

// The mission's instrument layer: the drafting labels that the scene projects
// onto its objects. All of it is decorative (aria-hidden); the loop in
// MissionHero writes the live values.

/** Live DOM nodes by key, registered through `bind` and written by the loop in MissionHero. */
export type DomNodes = Map<string, HTMLElement>;
export type Bind = (key: string) => (el: HTMLElement | null) => void;

const MONO = "font-mono uppercase tracking-[0.12em] tabular-nums";
const SHORT = ["CONTENT", "SEARCH", "REDDIT", "CREATORS"];
const LONG = ["TECHNICAL CONTENT", "SEO + AI SEARCH", "REDDIT", "CREATOR DISTRIBUTION"];

type Props = {
  className?: string;
  /** The scene has rendered: the projected labels fade in with it, never ahead of it. */
  ready: boolean;
  bind: Bind;
};

export default function MissionHud({ className = "", ready, bind }: Props) {
  const focus = useSyncExternalStore(channelFocus.subscribe, channelFocus.get, () => null);
  const node = bind;
  const label = (id: LabelId) => bind(id);

  return (
    <div className={`pointer-events-none absolute inset-0 z-[5] ${className}`}>
      {/* Projected labels share the canvas box. */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden transition-opacity duration-700" style={{ opacity: ready ? 1 : 0 }}>
        <Leader nodeRef={label("payload")} kicker="PAYLOAD" text="Your devtool" />
        <Leader nodeRef={label("devable")} kicker="DEVABLE" text="Launch system and mission control" />
        <div ref={label("channels")} className="invisible absolute top-0 left-0 opacity-0 will-change-transform">
          <div className="absolute top-[-6px] left-[-1.5px] flex items-start">
            <span className="mt-[4.5px] size-[3px] shrink-0 bg-foreground/60" />
            <span className="mt-[6px] h-px w-(--lead) shrink-0 bg-foreground/25" />
            <div className="-mt-px pl-2.5">
              <p className={`${MONO} text-[10px] leading-[12px] whitespace-nowrap text-foreground/45`}>
                CHANNEL SYSTEMS<span ref={node("allGo")} className="opacity-0 transition-opacity duration-300 data-[on=true]:opacity-100"> · ALL GO</span>
              </p>
              <ul className="mt-1.5 grid gap-1">
                {CHANNELS.map((c, i) => (
                  <li
                    key={c.n}
                    className={`flex items-center gap-2 ${MONO} text-[10px] leading-[12px] whitespace-nowrap transition-colors ${focus === i ? "text-foreground/80" : "text-foreground/50"}`}
                  >
                    <span className="w-[1.8em]">{c.n}</span>
                    <span className="w-[7.5em]">{SHORT[i]}</span>
                    <span className="h-[2px] w-2" style={{ background: c.color }} />
                    <span
                      ref={bind(`go${i}`)}
                      className="w-[2em] text-foreground/35 data-[go=true]:text-foreground/80"
                    >
                      —
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <Plain nodeRef={label("karman")}>KÁRMÁN LINE · 100 KM</Plain>
        <Plain nodeRef={label("spike")}>SUBORBITAL · LAUNCH SPIKE</Plain>
        <Plain nodeRef={label("meco")}>MECO · STAGE SEP</Plain>
        <Plain nodeRef={label("orbit")}>ORBIT · 412 KM</Plain>
        {CHANNELS.map((c, i) => (
          <Plain key={c.n} nodeRef={label(`a${i}` as LabelId)} emphasis={focus === i}>
            <span style={{ color: c.deep }}>{c.n}</span> · {LONG[i]} · <span className="normal-case" style={{ color: c.deep }}>{c.cap}</span>
          </Plain>
        ))}
      </div>
    </div>
  );
}

function Leader({ nodeRef, kicker, text }: { nodeRef: (el: HTMLElement | null) => void; kicker: string; text: string }) {
  return (
    <div ref={nodeRef} className="invisible absolute top-0 left-0 opacity-0 will-change-transform">
      <div className="absolute top-[-6px] left-[-1.5px] flex items-start">
        <span className="mt-[4.5px] size-[3px] shrink-0 bg-foreground/60" />
        <span className="mt-[6px] h-px w-(--lead) shrink-0 bg-foreground/25" />
        <div className="-mt-px pl-2.5">
          <p className={`${MONO} text-[10px] leading-[12px] whitespace-nowrap text-foreground/45`}>{kicker}</p>
          <p className="mt-1 text-[13px] leading-tight tracking-[-0.01em] whitespace-nowrap text-foreground/70">{text}</p>
        </div>
      </div>
    </div>
  );
}

function Plain({ nodeRef, emphasis, children }: { nodeRef: (el: HTMLElement | null) => void; emphasis?: boolean; children: ReactNode }) {
  return (
    <div ref={nodeRef} className="group invisible absolute top-0 left-0 opacity-0 will-change-transform">
      <div className="absolute top-[-6px] left-[-1.5px] flex items-start gap-2 group-data-[side=left]:right-[-1.5px] group-data-[side=left]:left-auto group-data-[side=left]:flex-row-reverse">
        <span className="mt-[4.5px] size-[3px] shrink-0 bg-foreground/60" />
        <p
          className={`${MONO} text-[10px] leading-[12px] whitespace-nowrap transition-colors ${emphasis ? "text-foreground/80" : "text-foreground/45"}`}
        >
          {children}
        </p>
      </div>
    </div>
  );
}
