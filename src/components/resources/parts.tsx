import Image from "next/image";
import { formatDate, type Resource, type Tone } from "@/lib/resources";

// Shared pieces for the blog, guides and the Resources menu. Server-safe and hook-free, so the client
// navbar can use them too.

type Palette = { bg: string; fg: string; soft: string; line: string; card: string; dots: string; text: string };

// Each topic's tone colours its chip dot and the cover drawn when an item has no thumbnail.
const TONES: Record<Tone, Palette> = {
  green: { bg: "#10241a", fg: "#19e76e", soft: "rgb(25 231 110 / 0.16)", line: "rgb(255 255 255 / 0.16)", card: "rgb(255 255 255 / 0.06)", dots: "rgb(255 255 255 / 0.07)", text: "rgb(255 255 255 / 0.55)" },
  orange: { bg: "#f6dccf", fg: "#d96543", soft: "rgb(217 101 67 / 0.22)", line: "rgb(23 44 33 / 0.16)", card: "rgb(255 255 255 / 0.6)", dots: "rgb(23 44 33 / 0.07)", text: "rgb(23 44 33 / 0.55)" },
  sage: { bg: "#dde9e1", fg: "#172c21", soft: "rgb(23 44 33 / 0.1)", line: "rgb(23 44 33 / 0.16)", card: "rgb(255 255 255 / 0.7)", dots: "rgb(23 44 33 / 0.07)", text: "rgb(23 44 33 / 0.5)" },
  ink: { bg: "#1a1918", fg: "#19e76e", soft: "rgb(255 255 255 / 0.1)", line: "rgb(255 255 255 / 0.14)", card: "rgb(255 255 255 / 0.05)", dots: "rgb(255 255 255 / 0.06)", text: "rgb(255 255 255 / 0.5)" },
};

export const toneDot = (tone: Tone) => (tone === "sage" ? "#8fa898" : TONES[tone].fg);

// One quiet drawing per tone, on a 480 × 300 canvas: search rings and results, creator faces and a reach
// bar, a community thread, a code window.
function Motif({ tone }: { tone: Tone }) {
  const c = TONES[tone];
  if (tone === "green")
    return (
      <>
        {[104, 70, 36].map((r) => (
          <circle key={r} cx="150" cy="150" r={r} fill="none" stroke={c.line} />
        ))}
        <circle cx="150" cy="150" r="9" fill={c.fg} />
        <circle cx="220" cy="104" r="4" fill={c.fg} />
        <circle cx="96" cy="210" r="4" fill={c.line} />
        <rect x="282" y="96" width="150" height="26" rx="6" fill={c.fg} />
        <rect x="292" y="105" width="8" height="8" rx="2" fill={c.bg} />
        <rect x="308" y="106" width="70" height="6" rx="3" fill={c.bg} opacity="0.55" />
        <rect x="282" y="137" width="150" height="26" rx="6" fill={c.card} stroke={c.line} />
        <rect x="282" y="178" width="118" height="26" rx="6" fill={c.card} stroke={c.line} />
      </>
    );
  if (tone === "orange")
    return (
      <>
        {[172, 217, 262, 307].map((cx, i) => (
          <circle key={cx} cx={cx} cy="128" r="34" fill={i === 1 ? c.fg : c.card} stroke={c.bg} strokeWidth="5" />
        ))}
        <path d="M211 116 L229 128 L211 140 Z" fill={c.bg} />
        <rect x="140" y="192" width="200" height="10" rx="5" fill={c.soft} />
        <rect x="140" y="192" width="138" height="10" rx="5" fill={c.fg} />
        <rect x="140" y="214" width="84" height="6" rx="3" fill={c.line} />
      </>
    );
  if (tone === "sage")
    return (
      <>
        <path d="M128 106 V146 H152 M168 160 V200 H192" fill="none" stroke={c.line} strokeWidth="2" />
        {[
          [110, 60, 260, 46, true],
          [152, 124, 218, 40, false],
          [192, 178, 178, 40, false],
        ].map(([x, y, w, h, lead]) => (
          <g key={String(y)}>
            <rect x={x as number} y={y as number} width={w as number} height={h as number} rx="10" fill={c.card} stroke={c.line} />
            <path
              d={`M${(x as number) + 18} ${(y as number) + (h as number) / 2 + 4} l7 -9 l7 9 z`}
              fill={lead ? "#d96543" : c.fg}
              opacity={lead ? 1 : 0.5}
            />
            <rect x={(x as number) + 42} y={(y as number) + (h as number) / 2 - 3} width={(w as number) * 0.55} height="6" rx="3" fill={c.line} />
          </g>
        ))}
      </>
    );
  return (
    <>
      <rect x="100" y="52" width="280" height="196" rx="12" fill={c.card} stroke={c.line} />
      {[124, 140, 156].map((cx) => (
        <circle key={cx} cx={cx} cy="74" r="4.5" fill={c.line} />
      ))}
      <path d="M100 94 H380" stroke={c.line} />
      {[
        [124, 116, 120],
        [144, 136, 150],
        [144, 156, 96, true],
        [164, 176, 130],
        [124, 196, 60],
      ].map(([x, y, w, hot]) => (
        <rect key={String(y)} x={x as number} y={y as number} width={w as number} height="7" rx="3.5" fill={hot ? c.fg : c.line} />
      ))}
      <path d="M318 204 l-12 12 l12 12 M342 204 l12 12 l-12 12" fill="none" stroke={c.fg} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

/**
 * The item's thumbnail from the CMS, or a drawn cover in its topic's tone. The caller sets the shape
 * (aspect ratio, radius) through `className`; `label` adds a small caption in the corner.
 */
export function Cover({
  item,
  className = "",
  label,
  sizes = "(min-width: 1024px) 33vw, 100vw",
  priority = false,
}: {
  item: Resource;
  className?: string;
  label?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const c = TONES[item.topic.tone];
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: c.bg }}>
      {item.cover ? (
        <Image src={item.cover.url} alt={item.cover.alt} fill sizes={sizes} priority={priority} className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]" />
      ) : (
        <>
          <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: `radial-gradient(${c.dots} 1px, transparent 1px)`, backgroundSize: "14px 14px" }} />
          <svg
            aria-hidden="true"
            viewBox="0 0 480 300"
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 size-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] motion-reduce:transition-none"
          >
            <Motif tone={item.topic.tone} />
          </svg>
        </>
      )}
      {label && (
        <span className="absolute bottom-3 left-3.5 font-mono text-[0.62rem] tracking-[0.14em] uppercase" style={{ color: item.cover ? "#fff" : c.text }}>
          {label}
        </span>
      )}
    </div>
  );
}

/** The topic as the site's soft pill with a tone dot (the case studies' service chips). */
export function TopicChip({ item, dark = false }: { item: Resource; dark?: boolean }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.75rem] font-medium tracking-[-0.005em] ${
        dark ? "bg-white/10 text-white/85" : "bg-[#f4f2eb] text-ink"
      }`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: toneDot(item.topic.tone) }} />
      {item.topic.title}
    </span>
  );
}

/** Date and read time in the site's small mono. */
export function Meta({ item, className = "" }: { item: Resource; className?: string }) {
  return (
    <span className={`font-mono text-[0.68rem] tracking-[0.08em] uppercase ${className}`}>
      <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
      {item.readMinutes && <> · {item.readMinutes} min read</>}
    </span>
  );
}

export function Byline({ item, dark = false }: { item: Resource; dark?: boolean }) {
  const { name, role, avatar } = item.author;
  return (
    <span className="flex items-center gap-2.5">
      {avatar ? (
        <Image src={avatar} alt="" width={28} height={28} className={`size-7 rounded-full object-cover ${dark ? "bg-white" : "bg-[#f4f2eb]"} p-0.5`} />
      ) : (
        <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-ink text-[0.7rem] font-medium text-white">
          {name[0]}
        </span>
      )}
      <span className={`text-[0.85rem] ${dark ? "text-white/70" : "text-ink/70"}`}>
        {name}
        {role && <span className={dark ? "text-white/40" : "text-ink/40"}> · {role}</span>}
      </span>
    </span>
  );
}

/** The grow-in underline the site uses on text links; put `group` on the link. */
export const UNDERLINE =
  "bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-[length:100%_1px] group-focus-visible:bg-[length:100%_1px]";
