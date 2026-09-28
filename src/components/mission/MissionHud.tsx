"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { channelFocus } from "../growth-engine/channelFocus";
import { CHANNELS } from "../growth-engine/channels";
import { BEATS, scrollS, type LabelId } from "./timeline";

// The mission's instrument layer: a telemetry strip under the navbar, the
// clickable flight plan along the bottom and the drafting labels that the
// scene projects onto its objects. All of it is decorative (aria-hidden) except
// the flight-plan buttons; the loop in MissionHero writes the live values.

/** Live DOM nodes by key, registered through `bind` and written by the loop in MissionHero. */
export type DomNodes = Map<string, HTMLElement>;
export type Bind = (key: string) => (el: HTMLElement | null) => void;

const MONO = "font-mono uppercase tracking-[0.12em] tabular-nums";
const SHORT = ["CONTENT", "SEARCH", "REDDIT", "CREATORS"];
const LONG = ["TECHNICAL CONTENT", "SEO + AI SEARCH", "REDDIT", "CREATOR DISTRIBUTION"];

type Props = {
  className?: string;
  beat: number;
  /** The scene has rendered: the projected labels fade in with it, never ahead of it. */
  ready: boolean;
  bind: Bind;
  /** Scroll to a progress value. */
  onJump: (at: number) => void;
};

export default function MissionHud({ className = "", beat, ready, bind, onJump }: Props) {
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

      {/* Telemetry. */}
      <dl aria-hidden="true" className={`absolute top-[104px] left-[8vw] flex gap-7 ${MONO} text-[11px] leading-none`}>
        <div className="text-foreground/70">DVB‑01</div>
        <Field label="MET">
          <span ref={node("met")} className="inline-block min-w-[11ch]">T–48:00:00</span>
        </Field>
        <Field label="STATUS">
          <span ref={node("status")} className="inline-block min-w-[30ch] transition-colors data-[act=true]:text-accent">
            INTEGRATION
          </span>
        </Field>
        <Field fieldRef={node("altField")} label="ALT" hidden>
          <span ref={node("alt")} className="inline-block min-w-[7ch]">0 KM</span>
        </Field>
        <Field fieldRef={node("velField")} label="VEL" hidden>
          <span ref={node("vel")} className="inline-block min-w-[10ch]">0.00 KM/S</span>
        </Field>
        <Field fieldRef={node("pipeField")} label="PIPELINE" hidden>
          <span ref={node("pipe")} className="inline-block min-w-[6ch]">+0%</span>
        </Field>
      </dl>

      {/* Flight plan: the story's beats, clickable. */}
      <nav aria-label="Flight plan" className="pointer-events-auto absolute inset-x-[8vw] bottom-7">
        <div ref={node("rail")} className="relative h-px bg-foreground/12 [--p:0]">
          <div className="absolute inset-0 origin-left bg-forest [transform:scaleX(var(--p))]" />
          <div className="absolute top-[-4px] left-[calc(var(--p)*100%)] h-[9px] w-px bg-forest" />
          {BEATS.map((b) => (
            <span key={b.label} aria-hidden="true" className="absolute top-0 h-[5px] w-px bg-foreground/25" style={{ left: `${scrollS(b.start) * 100}%` }} />
          ))}
        </div>
        <div className="relative mt-2.5 h-3">
          {BEATS.map((b, i) => (
            <button
              key={b.label}
              type="button"
              aria-label={`Jump to ${b.name}`}
              aria-current={i === beat ? "step" : undefined}
              onClick={() => onJump(b.land)}
              className={`absolute top-0 ${MONO} cursor-pointer text-[10px] leading-3 transition-colors hover:text-foreground/80 focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-forest ${
                i === beat ? "text-foreground/80" : "text-foreground/35"
              }`}
              style={{ left: `${scrollS(b.start) * 100}%` }}
            >
              {b.label}
            </button>
          ))}
          <span aria-hidden="true" className={`absolute top-0 right-0 ${MONO} text-[10px] leading-3 text-foreground/35`}>
            NOT TO SCALE
          </span>
        </div>
      </nav>
    </div>
  );
}

function Field({ label, hidden, fieldRef, children }: { label: string; hidden?: boolean; fieldRef?: (el: HTMLElement | null) => void; children: ReactNode }) {
  return (
    <div ref={fieldRef} data-on={hidden ? "false" : "true"} className="flex gap-2 transition-opacity duration-500 data-[on=false]:opacity-0">
      <dt className="text-foreground/35">{label}</dt>
      <dd className="text-foreground/70">{children}</dd>
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
