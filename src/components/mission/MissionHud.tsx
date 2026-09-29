"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { channelFocus } from "../growth-engine/channelFocus";
import { CHANNELS } from "../growth-engine/channels";
import StationChips from "./StationChips";
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
      {/* Projected labels share the canvas box: small glass chips on 1 px leaders (styled by .hud-chip). */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden transition-opacity duration-700" style={{ opacity: ready ? 1 : 0 }}>
        <Leader nodeRef={label("payload")}>
          <p className={`${MONO} text-[10px] leading-[12px] text-foreground/55`}>PAYLOAD</p>
          <p className="mt-1 text-[13px] leading-tight tracking-[-0.01em] text-foreground/85">Your devtool</p>
        </Leader>
        <Leader nodeRef={label("devable")}>
          <p className={`${MONO} text-[10px] leading-[12px] text-foreground/55`}>DEVABLE</p>
          <p className="mt-1 text-[13px] leading-tight tracking-[-0.01em] text-foreground/85">Launch system and mission control</p>
        </Leader>
        <Leader nodeRef={label("channels")}>
          <p className={`${MONO} text-[10px] leading-[12px] text-foreground/55`}>
            CHANNEL SYSTEMS<span ref={node("allGo")} className="opacity-0 transition-opacity duration-300 data-[on=true]:opacity-100"> · ALL GO</span>
          </p>
          <ul className="mt-1.5 grid gap-1">
            {CHANNELS.map((c, i) => (
              <li
                key={c.n}
                className={`flex items-center gap-2 ${MONO} text-[10px] leading-[12px] transition-colors ${focus === i ? "text-foreground/90" : "text-foreground/65"}`}
              >
                <span className="w-[1.8em]">{c.n}</span>
                <span className="w-[7.5em]">{SHORT[i]}</span>
                <span className="h-[2px] w-2" style={{ background: c.color }} />
                <span ref={bind(`go${i}`)} className="w-[2em] text-foreground/40 data-[go=true]:text-foreground/90">
                  —
                </span>
              </li>
            ))}
          </ul>
        </Leader>
        <StationChips bind={bind} />
        <Plain nodeRef={label("pad")}>PAD 01 · 28.5°N</Plain>
        <Plain nodeRef={label("spike")}>SUBORBITAL · LAUNCH SPIKE</Plain>
        <Plain nodeRef={label("meco")}>MECO · STAGE SEP</Plain>
        <Plain nodeRef={label("fairing")}>FAIRING SEP</Plain>
        <Plain nodeRef={label("orbit")}>ORBIT · 412 KM</Plain>
        {CHANNELS.map((c, i) => (
          <Plain key={c.n} nodeRef={label(`a${i}` as LabelId)} emphasis={focus === i}>
            <span style={{ color: c.color }}>{c.n}</span> · {LONG[i]} · <span className="normal-case">{c.cap}</span>
          </Plain>
        ))}
        <Plain nodeRef={label("residual")}>
          <span className="text-[#ffb547]">
            RESIDUAL <span ref={node("residualVal")}>−0.0%</span>
          </span>
        </Plain>
        <Plain nodeRef={label("dv")}>Δv +0.42 M/S</Plain>
        <Plain nodeRef={label("parking")}>PARKING · 412 KM</Plain>
        <Plain nodeRef={label("now")}>
          NOW · <span ref={node("nowVal")}>412</span> KM
        </Plain>
      </div>

      {/* The rail's footing: pale haze over the sky, deep shade over space (crossfaded with the ink). */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[120px] bg-[linear-gradient(0deg,rgb(230_238_246/0.7),transparent)] transition-opacity duration-300 in-data-[ink=dark]:opacity-0" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(0deg,rgb(3_6_13/0.85),transparent)] opacity-0 transition-opacity duration-300 in-data-[ink=dark]:opacity-100" />

      {/* Telemetry. */}
      <dl
        aria-hidden="true"
        className={`absolute top-6 left-[calc(8vw-12px)] flex gap-7 ${MONO} text-[11px] leading-none in-data-[ink=dark]:border-b in-data-[ink=dark]:border-white/8 in-data-[ink=dark]:pb-2.5`}
      >
        <div className="text-foreground/75">DVB‑01</div>
        <Field label="MET">
          <span ref={node("met")} className="inline-block min-w-[11ch]">T–48:00:00</span>
        </Field>
        <Field label="STATUS">
          <span ref={node("status")} className="inline-block min-w-[30ch] transition-colors data-[act=true]:text-accent in-data-[ink=dark]:data-[act=true]:text-[#5fd39a]">
            INTEGRATION
          </span>
        </Field>
        <Field fieldRef={node("altField")} label="ALT" hidden>
          <span ref={node("alt")} className="inline-block min-w-[7ch]">0 KM</span>
          {/* The Kármán line passes as a toast beside the altitude (100–160 km). */}
          <span
            ref={node("karman")}
            data-on="false"
            className="hud-chip absolute top-[calc(100%+16px)] left-0 px-1.5 py-[3px] text-[10px] whitespace-nowrap text-foreground/80 opacity-0 transition-opacity duration-300 data-[on=true]:opacity-100"
          >
            KÁRMÁN LINE · 100 KM
          </span>
        </Field>
        <Field fieldRef={node("velField")} label="VEL" hidden>
          <span ref={node("vel")} className="inline-block min-w-[10ch]">0.00 KM/S</span>
        </Field>
        <Field fieldRef={node("pipeField")} label="PIPELINE" hidden>
          <span ref={node("pipe")} className="inline-block min-w-[6ch]">+0%</span>
        </Field>
      </dl>

      <p aria-hidden="true" className={`absolute top-6 right-[calc(8vw-12px)] ${MONO} text-[10px] leading-[11px] text-foreground/55 in-data-[ink=dark]:text-foreground/45`}>
        EARTH IMAGERY: NASA · NOT TO SCALE
      </p>

      {/* Flight plan: the story's beats, clickable. */}
      <nav aria-label="Flight plan" className="pointer-events-auto absolute inset-x-[calc(8vw-12px)] bottom-6">
        <div ref={node("rail")} className="relative h-px bg-foreground/15 [--p:0] in-data-[ink=dark]:bg-white/20">
          <div className="absolute inset-0 origin-left bg-forest [transform:scaleX(var(--p))] in-data-[ink=dark]:bg-white/90" />
          <div className="absolute top-[-4px] left-[calc(var(--p)*100%)] h-[9px] w-px bg-forest in-data-[ink=dark]:bg-white/90" />
          {BEATS.map((b) => (
            <span key={b.label} aria-hidden="true" className="absolute top-0 h-[5px] w-px bg-foreground/30" style={{ left: `${scrollS(b.start) * 100}%` }} />
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
              className={`absolute top-0 ${MONO} cursor-pointer text-[10px] leading-3 transition-colors hover:text-foreground/90 focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-forest in-data-[ink=dark]:focus-visible:outline-white ${
                i === beat ? "text-foreground/90" : "text-foreground/60 in-data-[ink=dark]:text-foreground/50"
              }`}
              style={{ left: `${scrollS(b.start) * 100}%` }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function Field({ label, hidden, fieldRef, children }: { label: string; hidden?: boolean; fieldRef?: (el: HTMLElement | null) => void; children: ReactNode }) {
  return (
    <div ref={fieldRef} data-on={hidden ? "false" : "true"} className="relative flex gap-2 transition-opacity duration-500 data-[on=false]:opacity-0">
      <dt className="text-foreground/45">{label}</dt>
      <dd className="text-foreground/80">{children}</dd>
    </div>
  );
}

/** A chip at the end of a long leader running right from its anchor (the pad shot's call-outs); --lead is its length. */
function Leader({ nodeRef, children }: { nodeRef: (el: HTMLElement | null) => void; children: ReactNode }) {
  return (
    <div ref={nodeRef} className="invisible absolute top-0 left-0 opacity-0 will-change-transform">
      <div className="absolute top-[-8px] left-[-1.5px] flex items-start">
        <span className="mt-[6.5px] size-[3px] shrink-0 bg-foreground/70" />
        <span className="mt-[8px] h-px w-(--lead) shrink-0 bg-foreground/35" />
        <div className="hud-chip whitespace-nowrap">{children}</div>
      </div>
    </div>
  );
}

/** A one-line chip on a short leader beside its anchor; data-side="left" flips it. */
function Plain({ nodeRef, emphasis, children }: { nodeRef: (el: HTMLElement | null) => void; emphasis?: boolean; children: ReactNode }) {
  return (
    <div ref={nodeRef} className="group invisible absolute top-0 left-0 opacity-0 will-change-transform">
      <div className="absolute top-[-12px] left-[-1.5px] flex items-center group-data-[side=left]:right-[-1.5px] group-data-[side=left]:left-auto group-data-[side=left]:flex-row-reverse">
        <span className="size-[3px] shrink-0 bg-foreground/70" />
        <span className="h-px w-2.5 shrink-0 bg-foreground/35" />
        <p className={`hud-chip ${MONO} text-[10px] leading-[12px] whitespace-nowrap transition-colors ${emphasis ? "text-foreground/95" : "text-foreground/75"}`}>
          {children}
        </p>
      </div>
    </div>
  );
}
