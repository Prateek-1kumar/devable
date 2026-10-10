import { useId, type CSSProperties, type ReactNode } from "react";
import { MARKS, MARK_COLOR } from "../how-we-work/marks";
import { CHANNELS, LINKS, LOOP, MOCKS, OUTCOMES, PRODUCT } from "./content";
import { MINT } from "./core-view";
import { CARD_W, CARDS, CORE_Y, CX, H, LOOP_Y, ROW_H, SIDE_H, SIDE_W, SIDE_Y, W } from "./layout";
import SceneCanvas from "./SceneCanvas";

// The Devable Growth System: one diagram of how a technical product becomes
// compounding visibility. Your Product feeds the core, the core drives four
// channels, the channels add up to outcomes, and what we learn loops back.
//
// Desktop (xl+) draws it on a fixed 1232px stage (layout.ts): the DOM cards sit
// over one 3D layer holding the engine and the pipes between everything, all
// in the same coordinates. Below xl the same cards stack. Motion is ambient
// only, and reduced motion gets one still frame.

// ── Small parts ─────────────────────────────────────────────────────────────
const ICONS = {
  cube: "M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z M4 7.5l8 4.5 8-4.5 M12 12v9",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5 M16 4.3a3.5 3.5 0 0 1 0 6.4 M18 14.8c1.9.7 3.2 2.6 3.5 5.2",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z M12 12.6v-1.2",
  doc: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z M14 3v5h5 M9 13h6 M9 17h4",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M20 20l-4.2-4.2",
  bubble: "M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1.1-4.6A8.5 8.5 0 1 1 20.5 12Z",
  arrowUp: "M12 19V5 M6 11l6-6 6 6",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z",
  share: "M4 13v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6 M16 7l-4-4-4 4 M12 3v12",
  repost: "M17 3l3 3-3 3 M4 11V9a3 3 0 0 1 3-3h13 M7 21l-3-3 3-3 M20 13v2a3 3 0 0 1-3 3H4",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z",
  upvote: "M12 4l7 8h-4v7H9v-7H5l7-8Z",
  loop: "M20 11a8 8 0 0 0-14.3-4.9L4 8 M4 4v4h4 M4 13a8 8 0 0 0 14.3 4.9L20 16 M20 20v-4h-4",
  megaphone: "M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1Z M16 9a4 4 0 0 1 0 6 M18.5 6.5a7.5 7.5 0 0 1 0 11",
} as const;

function Icon({ name, className = "size-4", strokeWidth = 1.6 }: { name: keyof typeof ICONS; className?: string; strokeWidth?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  );
}

function Brand({ name, className = "size-3.5", color }: { name: "reddit" | "x" | "google"; className?: string; color?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  if (name === "google") {
    // Google's G in its four colours: quadrants clipped to the mark (as in how-we-work/kit).
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
        <clipPath id={id}>
          <path d={MARKS.google} />
        </clipPath>
        <g clipPath={`url(#${id})`}>
          <rect width="12" height="9" fill="#EA4335" />
          <rect y="9" width="7" height="15" fill="#FBBC05" />
          <rect x="7" y="14" width="17" height="10" fill="#34A853" />
          <rect x="12" width="12" height="14.2" fill="#4285F4" />
        </g>
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={MARKS[name]} fill={color ?? MARK_COLOR[name]} />
    </svg>
  );
}

/** LinkedIn's "in" tile, drawn by hand (Simple Icons no longer ships it). */
function LinkedIn({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <circle cx="7" cy="7.2" r="1.8" fill="#fff" />
      <path d="M5.4 9.8h3.2V19H5.4z M10.6 9.8h3.1v1.3c.5-.9 1.6-1.6 3.1-1.6 2.9 0 3.4 1.9 3.4 4.3V19H17v-4.6c0-1.1 0-2.4-1.5-2.4s-1.7 1.1-1.7 2.3V19h-3.2z" fill="#fff" />
    </svg>
  );
}

/** "Your Product", picked out the same way in every mockup. */
const You = ({ children }: { children: ReactNode }) => (
  <span className="rounded-[3px] bg-light-green-soft px-0.5 font-medium text-ink">{children}</span>
);

const Eyebrow = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p className={`font-mono text-[10px] tracking-[0.14em] text-muted uppercase ${className}`}>{children}</p>
);

// A light touch of depth: cards sit on the page as thin slabs (a warm underside edge and a soft
// contact shadow), inner surfaces as raised white panels with a top highlight.
const CARD =
  "rounded-[18px] bg-[#f8f7f3] shadow-[inset_0_1px_0_rgb(255_255_255/0.9),0_1px_0_#ece9e2,0_3px_0_#e4e0d7,0_22px_40px_-24px_rgb(23_44_33/0.28)]";
const SURFACE =
  "rounded-[12px] bg-white shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgb(23_44_33/0.04),0_1px_0_rgb(23_44_33/0.06),0_6px_14px_-10px_rgb(23_44_33/0.25)]";
const LIFT =
  "transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.9),0_1px_0_#ece9e2,0_3px_0_#e4e0d7,0_30px_48px_-24px_rgb(23_44_33/0.34)]";
const TILE =
  "grid shrink-0 place-items-center rounded-[9px] bg-white text-primary shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgb(23_44_33/0.05),0_2px_0_rgb(23_44_33/0.06),0_4px_8px_-4px_rgb(23_44_33/0.2)]";

const place = (x: number, y: number, w: number, h: number): CSSProperties => ({ left: x, top: y, width: w, height: h });

// ── Cards ───────────────────────────────────────────────────────────────────
function ProductCard({ style }: { style?: CSSProperties }) {
  return (
    <article style={style} className={`${CARD} ${LIFT} flex flex-col p-6 ${style ? "absolute" : ""}`}>
      <Eyebrow>{PRODUCT.eyebrow}</Eyebrow>
      <h3 className="mt-3 text-[1.45rem] leading-tight font-medium tracking-[-0.035em] text-ink">{PRODUCT.title}</h3>
      <p className="mt-2 text-[0.84rem] leading-relaxed text-ink/60">{PRODUCT.line}</p>
      <ul className="mt-6 space-y-2 xl:mt-auto">
        {PRODUCT.rows.map((row) => (
          <li key={row.label} className={`${SURFACE} flex items-center gap-3 p-2.5`}>
            <span className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-light-green-soft/70 text-primary">
              <Icon name={row.icon} />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-[0.84rem] font-medium text-ink">{row.label}</span>
              <span className="mt-0.5 block text-[0.72rem] text-muted">{row.sub}</span>
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function OutcomesCard({ style }: { style?: CSSProperties }) {
  return (
    <article style={style} className={`${CARD} ${LIFT} flex flex-col p-6 ${style ? "absolute" : ""}`}>
      <Eyebrow>{OUTCOMES.eyebrow}</Eyebrow>
      <h3 className="mt-3 text-[1.45rem] leading-tight font-medium tracking-[-0.035em] text-ink">{OUTCOMES.title}</h3>
      <p className="mt-2 text-[0.84rem] leading-relaxed text-ink/60">
        {OUTCOMES.line.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </p>
      <ul className="mt-6 space-y-2 xl:mt-auto">
        {OUTCOMES.rows.map((row) => (
          <li key={row.label} className={`${SURFACE} px-3 pt-2 pb-2.5`}>
            <span className="flex items-center justify-between text-[0.8rem] font-medium text-ink">
              {row.label}
              <Icon name="arrowUp" className="size-3.5 text-light-green" strokeWidth={2} />
            </span>
            <span className="mt-2 block h-[3px] overflow-hidden rounded-full bg-ink/[0.07]">
              <span className="block h-full rounded-full bg-light-green" style={{ width: `${row.level * 100}%` }} />
            </span>
          </li>
        ))}
        <li className="flex items-center justify-between rounded-[12px] bg-ink px-3.5 py-3 text-white">
          <span className="text-[1rem] font-medium tracking-[-0.02em]">{OUTCOMES.highlight}</span>
          <span className="flex items-center gap-2">
            <svg aria-hidden="true" viewBox="0 0 44 16" className="h-4 w-11">
              <path d="M1 14 9 11l7 1 8-5 8 1 11-7" fill="none" stroke={MINT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <Icon name="arrowUp" className="size-4" strokeWidth={2} />
          </span>
        </li>
      </ul>
    </article>
  );
}

function ChannelCard({
  channel,
  icon,
  style,
  children,
}: {
  channel: (typeof CHANNELS)[keyof typeof CHANNELS];
  icon: keyof typeof ICONS;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <article style={style} className={`${CARD} ${LIFT} flex flex-col p-4 ${style ? "absolute" : ""}`}>
      <header className="flex items-center gap-3 px-0.5">
        <span className={`${TILE} size-8`}>
          <Icon name={icon} />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <h3 className="text-[0.95rem] font-medium tracking-[-0.02em] text-ink">{channel.name}</h3>
          <span className="mt-0.5 block font-mono text-[9.5px] tracking-[0.06em] whitespace-nowrap text-muted uppercase">{channel.line}</span>
        </span>
        <span className="self-start font-mono text-[10px] tracking-[0.08em] text-ink/30">{channel.n}</span>
      </header>
      <div className={`${SURFACE} mt-3 flex-1 overflow-hidden p-3`}>{children}</div>
    </article>
  );
}

// ── Mockups ─────────────────────────────────────────────────────────────────
function ArticleMock() {
  const k = { color: MINT };
  const s = { color: "#b8e9d0" };
  return (
    <div className="flex h-full flex-col">
      <p className="text-[0.8rem] leading-snug font-medium tracking-[-0.01em] text-ink">{MOCKS.article.title}</p>
      <pre className="mt-2 rounded-[8px] bg-ink px-2.5 py-2 font-mono text-[9.5px] leading-[1.6] text-white/80">
        <span className="text-white/30">1 </span>
        <span style={k}>from</span> rag <span style={k}>import</span> Index{"\n"}
        <span className="text-white/30">2 </span>idx = Index(<span style={s}>&quot;./docs&quot;</span>){"\n"}
        <span className="text-white/30">3 </span>idx.query(<span style={s}>&quot;How do refunds work?&quot;</span>)
      </pre>
      <ul className="mt-auto flex gap-1.5 pt-2">
        {MOCKS.article.tags.map((tag) => (
          <li key={tag} className="rounded-full bg-[#f3f2ee] px-2 py-0.5 text-[10px] text-ink/70">
            {tag}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchMock() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-7 items-center gap-1.5 rounded-full border border-line px-2.5">
        <Brand name="google" className="size-3" />
        <span className="flex-1 truncate text-[10.5px] text-ink/80">{MOCKS.search.query}</span>
        <Icon name="search" className="size-3 text-primary" strokeWidth={2} />
      </div>
      <div className="mt-2 flex gap-3 border-b border-line/80 px-1 pb-1.5 text-[9px] text-muted">
        <span className="font-medium text-primary">All</span>
        <span>AI Mode</span>
        <span>News</span>
        <span>Images</span>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_92px] items-start gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="grid size-4 place-items-center rounded-[4px] bg-ink">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: MINT }} />
            </span>
            <span className="leading-none">
              <span className="block text-[10px] font-medium text-ink">{MOCKS.search.result}</span>
              <span className="block text-[8.5px] text-muted">{MOCKS.search.url}</span>
            </span>
          </div>
          <p className="mt-1.5 text-[10px] leading-snug font-medium text-primary">The complete guide to document parsing</p>
          <span className="mt-1.5 block h-1 w-full rounded-full bg-line" />
          <span className="mt-1 block h-1 w-3/4 rounded-full bg-line" />
          <span className="mt-2.5 flex items-center gap-1.5">
            <span className="size-3 rounded-[3px] bg-line" />
            <span className="h-1 w-16 rounded-full bg-line" />
          </span>
        </div>
        <div className="rounded-[8px] bg-light-green-soft/60 p-2">
          <span className="flex items-center gap-1 font-mono text-[8px] tracking-[0.08em] text-primary uppercase">
            <Icon name="sparkle" className="size-2.5" strokeWidth={2} />
            AI Overview
          </span>
          <p className="mt-1 text-[9px] leading-[1.35] text-ink/70">
            <span className="font-medium text-ink">{MOCKS.search.cite}</span> is a popular choice for parsing
            <span className="ml-0.5 inline-grid size-3 place-items-center rounded-full bg-white align-[1px] text-[7px] font-medium text-primary">1</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function RedditMock() {
  const m = MOCKS.reddit;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1.5 text-[10px]">
        <Brand name="reddit" className="size-3.5" />
        <span className="font-medium text-ink">{m.sub}</span>
        <span className="text-muted">· {m.age}</span>
      </div>
      <p className="mt-1.5 text-[0.8rem] leading-snug font-medium tracking-[-0.01em] text-ink">{m.title}</p>
      <p className="mt-1 text-[10.5px] leading-snug text-ink/65">
        {m.body[0]}
        <You>{m.body[1]}</You>
        {m.body[2]}
      </p>
      <div className="mt-auto flex items-center gap-3.5 pt-2 text-[10px] text-muted">
        <span className="flex items-center gap-1">
          <Icon name="upvote" className="size-3" />
          <span className="font-medium text-ink/80">{m.votes}</span>
          <Icon name="upvote" className="size-3 rotate-180" />
        </span>
        <span className="flex items-center gap-1">
          <Icon name="bubble" className="size-3" />
          {m.comments}
        </span>
        <span className="flex items-center gap-1">
          <Icon name="share" className="size-3" />
          Share
        </span>
      </div>
    </div>
  );
}

function CreatorMock() {
  const m = MOCKS.creator;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-full bg-[linear-gradient(135deg,#dfe8e2,#b9cfc2)] text-[8.5px] font-medium text-primary">AC</span>
        <span className="min-w-0 flex-1 truncate text-[10px] leading-tight">
          <span className="font-medium text-ink">{m.name}</span> <span className="text-muted">{m.handle} · 2d</span>
        </span>
        <Brand name="x" className="size-3" />
      </div>
      <p className="mt-1.5 text-[10.5px] leading-snug text-ink/75">
        {m.body[0]}
        <You>{m.body[1]}</You>
        {m.body[2]}
      </p>
      <div className="mt-2 flex items-center gap-2 rounded-[8px] border border-line/80 p-1.5">
        <span className="grid size-6 shrink-0 place-items-center rounded-[5px] bg-ink">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: MINT }} />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[9.5px] font-medium text-ink">{m.link.title}</span>
          <span className="block text-[8.5px] text-muted">{m.link.url}</span>
        </span>
      </div>
      <div className="mt-auto flex items-center gap-3.5 pt-2 text-[10px] text-muted">
        <span className="flex items-center gap-1">
          <Icon name="bubble" className="size-3" />
          {m.replies}
        </span>
        <span className="flex items-center gap-1">
          <Icon name="repost" className="size-3" />
          {m.reposts}
        </span>
        <span className="flex items-center gap-1">
          <Icon name="heart" className="size-3" />
          {m.likes}
        </span>
        <span className="ml-auto flex items-center gap-1">
          <span className="grid size-4 place-items-center rounded-[4px] bg-ink">
            <Brand name="x" className="size-2.5" color="#fff" />
          </span>
          <LinkedIn className="size-4" />
        </span>
      </div>
    </div>
  );
}

const CHANNEL_CARDS = [
  { key: "content", icon: "doc", Mock: ArticleMock },
  { key: "search", icon: "search", Mock: SearchMock },
  { key: "reddit", icon: "bubble", Mock: RedditMock },
  { key: "creators", icon: "megaphone", Mock: CreatorMock },
] as const;

function LoopPill({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <p
      style={style}
      className={`flex items-center gap-2.5 rounded-full bg-white px-4 py-2 text-[0.84rem] text-ink/80 shadow-[inset_0_1px_0_#fff,0_0_0_1px_var(--line),0_2px_0_#ebe8e1,0_10px_20px_-12px_rgb(23_44_33/0.25)] ${className}`}
    >
      <Icon name="loop" className="size-4 text-primary" />
      {LOOP.map((step, i) => (
        <span key={step} className="flex items-center gap-2.5">
          {i > 0 && <span className="text-muted">→</span>}
          {step}
        </span>
      ))}
    </p>
  );
}

function LinkLabel({ link, align, style }: { link: (typeof LINKS)[keyof typeof LINKS]; align: "left" | "right"; style: CSSProperties }) {
  return (
    <div style={style} className={`absolute w-[200px] ${align === "right" ? "text-right" : ""}`}>
      <p className="text-[0.88rem] font-medium tracking-[-0.015em] text-ink">{link.label}</p>
      <p className="mt-9 text-[0.76rem] leading-relaxed text-muted">{link.caption}</p>
    </div>
  );
}

// ── Section ─────────────────────────────────────────────────────────────────
export default function GrowthSystem() {
  return (
    <section id="growth-system" aria-labelledby="growth-system-title" className="px-5 pt-4 pb-24 sm:px-8 lg:pb-32">

      {/* Desktop: the diagram on one fixed stage. */}
      <div className="relative mx-auto mt-16 hidden xl:block" style={{ width: W, height: H }}>
        <SceneCanvas style={place(0, 0, W, H)} />
        <ProductCard style={place(0, SIDE_Y, SIDE_W, SIDE_H)} />
        <OutcomesCard style={place(W - SIDE_W, SIDE_Y, SIDE_W, SIDE_H)} />
        {CHANNEL_CARDS.map(({ key, icon, Mock }) => (
          <ChannelCard key={key} channel={CHANNELS[key]} icon={icon} style={place(CARDS[key].x, CARDS[key].y, CARD_W, ROW_H)}>
            <Mock />
          </ChannelCard>
        ))}
        <LinkLabel link={LINKS.in} align="left" style={{ left: SIDE_W + 28, top: CORE_Y - 30 }} />
        <LinkLabel link={LINKS.out} align="right" style={{ right: SIDE_W + 28, top: CORE_Y - 30 }} />
        <LoopPill className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: CX, top: LOOP_Y }} />
      </div>

      {/* Below xl: the same story, stacked. */}
      <div className="mx-auto mt-12 grid max-w-3xl gap-4 xl:hidden">
        <ProductCard />
        <div className="grid gap-4 sm:grid-cols-2">
          {CHANNEL_CARDS.map(({ key, icon, Mock }) => (
            <ChannelCard key={key} channel={CHANNELS[key]} icon={icon}>
              <Mock />
            </ChannelCard>
          ))}
        </div>
        <OutcomesCard />
        <LoopPill className="mx-auto w-fit" />
      </div>
    </section>
  );
}
