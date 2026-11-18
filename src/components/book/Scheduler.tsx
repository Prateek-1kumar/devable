"use client";

import { addDays, format, parseISO } from "date-fns";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import photo from "../../../public/about/founder.jpg";
import { FOUNDER } from "./content";

// The booking card, the page's one action, and the person behind it in one piece:
//   header   Sumanth, after the Scalerrs founder band: his portrait run down the left edge, his note in the first
//            person, his name with LinkedIn, and his title. A halftone texture fades in from the right.
//   time     a strip of the next bookable days (dead days never show), five at a time, each with its count of free
//            times; the picked day's times in a grid beneath; a confirm bar along the bottom that reads back the
//            choice and holds the time zone. The ink selection pill glides between days and between times.
//   details  name, company, work email, an optional note, with the chosen time pinned above.
//   done     the booked time, where the invite went, and a way to book another.
// Availability comes from /api/book/slots for the next six weeks in the visitor's time zone. Anything that
// depends on the visitor's clock or zone renders only in the browser; the server sends the card's frame.

type Slots = Record<string, string[]>;
/** What has been fetched for one time zone: the free slots, and the last day covered so far. */
type Loaded = { slots: Slots; until: string };
type Step = "time" | "details" | "done";
type Booking = { start: string; end: string; mock: boolean; email: string };

const EASE = [0.22, 1, 0.36, 1] as const;
const PAGE = 10; // days in the strip: two rows of five
const WINDOW = 42; // days of availability per fetch
const HORIZON = 182; // how far ahead the strip can page (Cal.com's own booking window still applies)
const DURATION = 30;
const noop = () => () => {};

let bootAt: number | undefined;
const useBrowser = () => ({
  tz: useSyncExternalStore(noop, () => Intl.DateTimeFormat().resolvedOptions().timeZone, () => null),
  now: useSyncExternalStore(noop, () => (bootAt ??= Date.now()), () => null),
});

const dayKey = (at: Date | number, timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
const clock = (iso: string | number, timeZone: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(new Date(iso)).toLowerCase().replace(/\s/u, "\u00a0");
const zoneName = (timeZone: string, style: "long" | "shortOffset" | "short", at: number) =>
  new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: style }).formatToParts(at).find((p) => p.type === "timeZoneName")?.value ?? timeZone;
const span = (iso: string, timeZone: string) => `${clock(iso, timeZone)} – ${clock(Date.parse(iso) + DURATION * 60_000, timeZone)}`;

/* ── small parts ─────────────────────────────────────────────────────────── */

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 15 14" className={cn("h-3.5 w-[15px] shrink-0", className)}>
      <path
        fill="currentColor"
        d="M14.817 7.496 9.192 13.796a.6.6 0 0 1-.884 0 .76.76 0 0 1 0-.991L12.866 7.7H.625C.28 7.7 0 7.387 0 7s.28-.7.625-.7h12.241L8.308 1.196a.76.76 0 0 1 0-.991.6.6 0 0 1 .884 0l5.625 6.3a.75.75 0 0 1 0 .991Z"
      />
    </svg>
  );
}

function Chevron({ dir }: { dir: "left" | "right" | "down" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={cn("shrink-0", dir === "down" ? "size-3 rotate-90" : "size-4", dir === "left" && "rotate-180")}>
      <path d="m6 3.5 4.5 4.5L6 12.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const PILL = { type: "spring", stiffness: 480, damping: 38, mass: 0.9 } as const;
const RING = "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/50";
const NAV =
  "grid size-8 place-items-center rounded-[8px] text-ink/60 transition-colors hover:bg-ink/[0.06] hover:text-ink disabled:pointer-events-none disabled:opacity-25 " + RING;
const INPUT =
  "w-full rounded-[8px] bg-white px-3.5 text-[0.93rem] text-ink shadow-[0_0_0_1px_rgb(23_44_33/0.12),0_1px_2px_rgb(23_44_33/0.04)] outline-none transition-shadow duration-200 placeholder:text-ink/30 hover:shadow-[0_0_0_1px_rgb(23_44_33/0.22),0_1px_2px_rgb(23_44_33/0.04)] focus:shadow-[0_0_0_1px_rgb(23_44_33/0.6),0_0_0_4px_rgb(23_44_33/0.06)]";
const PRIMARY =
  "group inline-flex h-11 shrink-0 items-center justify-center gap-2.5 rounded-[8px] bg-black px-5 text-[0.92rem] font-medium tracking-wide text-white shadow-sm transition-[background-color,color,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] outline-offset-4 hover:bg-primary hover:text-ink focus-visible:bg-primary focus-visible:text-ink disabled:pointer-events-none disabled:bg-ink/[0.07] disabled:text-ink/35 disabled:shadow-none";
const LINK = "text-[0.85rem] text-ink/55 underline decoration-ink/20 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink";

function Field({ label, optional, children }: { label: string; optional?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-[0.8rem] text-ink/70">
        {label}
        {optional && <span className="font-mono text-[0.64rem] tracking-[0.08em] text-ink/35 uppercase">Optional</span>}
      </span>
      {children}
    </label>
  );
}

/** Who you'll meet, after the Scalerrs founder band. Static, so it renders on the server too. */
function Host() {
  const { linkedin } = FOUNDER;
  return (
    <div className="relative flex overflow-hidden border-b border-ink/[0.07] bg-paper/70">
      <div className="relative w-[6.25rem] shrink-0 bg-black @min-[30rem]:w-[8.5rem]">
        <Image src={photo} alt={FOUNDER.name} fill sizes="136px" placeholder="blur" className="object-cover object-[50%_28%] grayscale" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(rgb(23_44_33/0.14)_0.9px,transparent_1.2px)] [background-size:5px_5px] [mask-image:linear-gradient(to_left,#000_10%,transparent)]"
      />
      <div className="relative min-w-0 flex-1 px-5 py-4 @min-[30rem]:px-6 @min-[30rem]:py-5">
        <p className="text-[0.9rem] leading-[1.55] text-pretty text-ink">{FOUNDER.note}</p>
        <p className="mt-3 text-[0.82rem] text-ink">
          <span className="font-medium">{FOUNDER.name}</span>
          <span className="mx-1.5 text-ink/25">|</span>
          {linkedin.followers ? `${linkedin.followers} Followers on ` : "Connect on "}
          <a href={linkedin.href} target="_blank" rel="noreferrer" className="font-medium text-[#0a66c2] underline-offset-4 hover:underline">
            LinkedIn
          </a>
        </p>
        <p className="mt-0.5 text-[0.8rem] text-ink/50">
          {FOUNDER.title} <span className="text-ink/80">{FOUNDER.company}</span>
        </p>
      </div>
    </div>
  );
}

/* ── the card ────────────────────────────────────────────────────────────── */

export default function Scheduler() {
  const browser = useBrowser();
  const [tzPick, setTzPick] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, Loaded | "error">>({});
  const inflight = useRef<string | null>(null);
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);
  const [dayPick, setDayPick] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("time");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);

  const tz = tzPick ?? browser.tz;
  const now = browser.now;
  const todayKey = tz !== null && now !== null ? dayKey(now, tz) : null;
  const entry = tz ? cache[tz] : undefined;
  const loaded = entry !== undefined && entry !== "error";
  const slots = useMemo<Slots>(() => (entry && entry !== "error" ? entry.slots : {}), [entry]);
  const horizonKey = todayKey ? format(addDays(parseISO(todayKey), HORIZON), "yyyy-MM-dd") : null;
  const hasMore = loaded && horizonKey !== null && entry.until < horizonKey;

  const days = useMemo(() => Object.keys(slots).sort(), [slots]);
  const pages = Math.max(1, Math.ceil(days.length / PAGE));
  const at = Math.min(page, pages - 1);
  const visible = days.slice(at * PAGE, at * PAGE + PAGE);
  const day = dayPick && days.includes(dayPick) ? dayPick : (visible[0] ?? null);
  const times = loaded && day ? slots[day] : [];

  // Availability arrives in six-week chunks: the first on load, the next whenever the strip is a page from the end
  // of what's loaded, so paging forward never waits and never runs out before the horizon.
  const nearEnd = at >= pages - 2;
  useEffect(() => {
    if (!tz || !todayKey || !horizonKey || entry === "error") return;
    if (entry && !(nearEnd && entry.until < horizonKey)) return;
    const from = entry ? format(addDays(parseISO(entry.until), 1), "yyyy-MM-dd") : todayKey;
    const to = format(addDays(parseISO(from), WINDOW), "yyyy-MM-dd");
    const end = to < horizonKey ? to : horizonKey;
    const key = `${tz}|${from}`;
    if (inflight.current === key) return;
    inflight.current = key;
    fetch(`/api/book/slots?${new URLSearchParams({ start: from, end, tz })}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { slots: Slots }) =>
        setCache((c) => {
          const prev = c[tz];
          const base = prev && prev !== "error" ? prev.slots : {};
          return { ...c, [tz]: { slots: { ...base, ...d.slots }, until: end } };
        }),
      )
      .catch(() =>
        // A failed first load shows a retry; a failed later chunk just ends the strip where it is.
        setCache((c) => {
          const prev = c[tz];
          return { ...c, [tz]: prev && prev !== "error" ? { ...prev, until: horizonKey } : "error" };
        }),
      )
      .finally(() => {
        if (inflight.current === key) inflight.current = null;
      });
  }, [tz, todayKey, horizonKey, entry, nearEnd]);

  const tomorrowKey = todayKey ? format(addDays(parseISO(todayKey), 1), "yyyy-MM-dd") : null;

  // "November 2026", or "Nov \u2013 Dec 2026" when the strip spans two months.
  const ends = visible.length ? [parseISO(visible[0]), parseISO(visible[visible.length - 1])] : null;
  const caption = !ends
    ? "\u00a0"
    : ends[0].getMonth() === ends[1].getMonth()
      ? format(ends[0], "MMMM yyyy")
      : `${format(ends[0], "MMM")} \u2013 ${format(ends[1], "MMM yyyy")}`;

  const zones = useMemo(
    () => (now === null ? [] : Intl.supportedValuesOf("timeZone").map((z) => ({ z, label: `${z.replaceAll("_", " ")} (${zoneName(z, "shortOffset", now)})` }))),
    [now],
  );

  const turn = (by: number) => {
    const next = Math.min(Math.max(at + by, 0), pages - 1);
    setDir(by);
    setPage(next);
    setDayPick(days[next * PAGE] ?? null);
    setSlot(null);
  };
  const refetch = () => tz && setCache(({ [tz]: _drop, ...rest }) => (void _drop, rest));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!slot || !tz || pending) return;
    const f = new FormData(e.currentTarget);
    setPending(true);
    setNotice(null);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(f), start: slot, timeZone: tz }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setBooking({ ...data.booking, email: String(f.get("email")) });
        setStep("done");
      } else if (data.taken) {
        setSlot(null);
        refetch();
        setStep("time");
        setNotice(data.error);
      } else setNotice(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setNotice("You seem to be offline. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const reset = () => {
    setBooking(null);
    setSlot(null);
    setDayPick(null);
    setPage(0);
    setNotice(null);
    setCache({});
    setStep("time");
  };

  const swap = {
    initial: { opacity: 0, y: 8, filter: "blur(4px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: -4 },
    transition: { duration: 0.4, ease: EASE },
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="@container flex w-full flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_0_0_1px_rgb(23_44_33/0.07),0_1px_2px_rgb(23_44_33/0.04),0_40px_70px_-44px_rgb(23_44_33/0.35),inset_0_1px_0_#fff]">
        <Host />

        {tz === null || now === null ? (
          <div aria-hidden="true" className="min-h-[24rem] flex-1" />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {step === "time" && (
              <motion.div key="time" {...swap} className="flex min-h-0 flex-1 flex-col">
                <div className="flex flex-col px-5 pt-5 @min-[30rem]:px-6">
                  {/* Caption and paging. */}
                  <div className="flex items-center justify-between">
                    <p className="text-[0.95rem] font-medium tracking-[-0.01em] text-ink">
                      Pick a time <span className="ml-1.5 font-normal text-ink/40">{caption}</span>
                    </p>
                    <div className="flex gap-1">
                      <button type="button" aria-label="Earlier days" onClick={() => turn(-1)} disabled={at === 0} className={NAV}>
                        <Chevron dir="left" />
                      </button>
                      <button type="button" aria-label="Later days" onClick={() => turn(1)} disabled={at >= pages - 1} className={cn(NAV, at >= pages - 1 && hasMore && "animate-pulse")}>
                        <Chevron dir="right" />
                      </button>
                    </div>
                  </div>

                  {/* The strip: only days with free times. */}
                  <LayoutGroup id="days">
                    <div className="relative -mx-1.5 mt-1.5 overflow-hidden px-1.5 pt-1.5 pb-3 -mb-2">
                      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
                        <motion.div
                          key={loaded ? at : "loading"}
                          custom={dir}
                          variants={{
                            enter: (d: number) => ({ opacity: 0, x: d * 28 }),
                            center: { opacity: 1, x: 0 },
                            exit: (d: number) => ({ opacity: 0, x: d * -28 }),
                          }}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ duration: 0.38, ease: EASE }}
                          role="radiogroup"
                          aria-label="Day"
                          className="grid grid-cols-5 gap-1.5"
                        >
                          {!loaded
                            ? Array.from({ length: PAGE }, (_, i) => (
                                <span key={i} className="h-[3.6rem] animate-pulse rounded-[11px] bg-ink/[0.045]" style={{ animationDelay: `${i * 80}ms` }} />
                              ))
                            : visible.map((d) => {
                                const on = d === day;
                                const date = parseISO(d);
                                const tag = d === todayKey ? "Today" : d === tomorrowKey ? "Tmrw" : format(date, "EEE");
                                return (
                                  <button
                                    key={d}
                                    type="button"
                                    role="radio"
                                    aria-checked={on}
                                    aria-label={`${format(date, "EEEE d MMMM")}, ${slots[d].length} times free`}
                                    onClick={() => {
                                      setDayPick(d);
                                      setSlot(null);
                                      setNotice(null);
                                    }}
                                    className={cn(
                                      "relative flex h-[3.6rem] flex-col items-center justify-center rounded-[11px] transition-[background-color,transform] duration-200 active:scale-[0.97]",
                                      on ? "text-white" : "bg-ink/[0.035] text-ink hover:bg-ink/[0.07]",
                                      RING,
                                    )}
                                  >
                                    {on && (
                                      <motion.span
                                        layoutId="day-pill"
                                        aria-hidden="true"
                                        transition={PILL}
                                        className="absolute inset-0 rounded-[11px] bg-ink shadow-[0_1px_2px_rgb(23_44_33/0.2),0_12px_22px_-12px_rgb(23_44_33/0.7)]"
                                      />
                                    )}
                                    <span className={cn("relative font-mono text-[0.6rem] tracking-[0.12em] uppercase", on ? "text-white/60" : "text-ink/45")}>{tag}</span>
                                    <span className="relative mt-px flex items-center gap-1.5">
                                      <span className="text-[1.15rem] leading-tight font-medium tracking-[-0.03em] tabular-nums">{format(date, "d")}</span>
                                      <span className={cn("hidden items-center gap-1 text-[0.62rem] tabular-nums @min-[30rem]:flex", on ? "text-white/60" : "text-ink/40")}>
                                        <span className="size-[5px] rounded-full bg-primary" />
                                        {slots[d].length}
                                      </span>
                                    </span>
                                  </button>
                                );
                              })}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </LayoutGroup>

                  {/* The day's times. */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <p className="font-mono text-[0.64rem] tracking-[0.1em] text-ink/45 uppercase">{day ? format(parseISO(day), "EEEE, d MMM") : " "}</p>
                    {loaded && day && <p className="text-[0.75rem] text-ink/40">{times.length} times &middot; 30 min</p>}
                  </div>
                  <div className="-mx-1 mt-2.5 h-[11.6rem] shrink-0 overflow-y-auto overscroll-contain px-1 pt-0.5 pb-4 [scrollbar-width:thin]">
                    {entry === "error" ? (
                      <p className="pt-2 text-[0.88rem] text-ink/60">
                        Couldn&rsquo;t load times.{" "}
                        <button type="button" onClick={refetch} className={LINK}>
                          Try again
                        </button>
                      </p>
                    ) : !loaded ? (
                      <div className="grid grid-cols-3 gap-1.5 @min-[30rem]:grid-cols-4">
                        {Array.from({ length: 8 }, (_, i) => (
                          <span key={i} className="h-10 animate-pulse rounded-[9px] bg-ink/[0.045]" style={{ animationDelay: `${i * 60}ms` }} />
                        ))}
                      </div>
                    ) : days.length === 0 ? (
                      <p className="pt-2 text-[0.88rem] text-ink/55">No open times in the next few weeks. Please check back soon.</p>
                    ) : (
                      <LayoutGroup id="times">
                        <div key={day} role="radiogroup" aria-label="Time" className="grid grid-cols-3 gap-1.5 @min-[30rem]:grid-cols-4">
                          {times.map((t, i) => {
                            const on = t === slot;
                            return (
                              <motion.button
                                key={t}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, ease: EASE, delay: Math.min(i, 12) * 0.022 }}
                                onClick={() => {
                                  setSlot(on ? null : t);
                                  setNotice(null);
                                }}
                                className={cn(
                                  "relative h-10 rounded-[9px] text-[0.86rem] tabular-nums transition-[background-color,color,box-shadow,transform] duration-200 active:scale-[0.97]",
                                  on
                                    ? "font-medium text-ink"
                                    : "text-ink shadow-[inset_0_0_0_1px_rgb(23_44_33/0.1)] hover:bg-light-green-soft/60 hover:shadow-[inset_0_0_0_1px_rgb(23_44_33/0.22)]",
                                  RING,
                                )}
                              >
                                {on && <motion.span layoutId="time-pill" aria-hidden="true" transition={PILL} className="absolute inset-0 rounded-[9px] bg-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_8px_16px_-10px_rgb(25_150_80/0.9)]" />}
                                <span className="relative">{clock(t, tz)}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </LayoutGroup>
                    )}
                  </div>
                </div>

                {/* Confirm bar: reads back the choice, holds the time zone and the one button. */}
                <div className={cn("flex items-center gap-4 border-t px-5 py-3.5 transition-colors duration-500 @min-[30rem]:px-6", slot ? "border-primary/25 bg-light-green-soft/55" : "border-ink/[0.07] bg-paper/70")}>
                  <div className="min-w-0 flex-1">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.p
                        key={slot ?? "none"}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.22, ease: EASE }}
                        className={cn("truncate text-[0.9rem] font-medium", slot ? "text-ink" : "text-ink/40")}
                      >
                        {slot && day ? `${format(parseISO(day), "EEE d MMM")} · ${span(slot, tz)}` : "Choose a time"}
                      </motion.p>
                    </AnimatePresence>
                    {/* Time zone: a native select laid over a quiet label, so it stays fully accessible. */}
                    <label className="relative mt-0.5 inline-flex max-w-full min-w-0 items-center gap-1.5 text-[0.78rem] text-ink/50 transition-colors focus-within:text-ink hover:text-ink">
                      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-[13px] shrink-0">
                        <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M1.75 8h12.5M8 1.75c1.8 1.7 2.7 3.8 2.7 6.25S9.8 12.55 8 14.25C6.2 12.55 5.3 10.45 5.3 8S6.2 3.45 8 1.75Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
                      </svg>
                      <span className="truncate">
                        {zoneName(tz, "long", now)} <span className="text-ink/35">({zoneName(tz, "shortOffset", now)})</span>
                      </span>
                      <Chevron dir="down" />
                      <select
                        aria-label="Time zone"
                        value={tz}
                        onChange={(e) => {
                          setTzPick(e.target.value);
                          setSlot(null);
                          setDayPick(null);
                          setPage(0);
                        }}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      >
                        {zones.map(({ z, label }) => (
                          <option key={z} value={z}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {notice && (
                    <p role="alert" className="hidden max-w-[12rem] text-right text-[0.8rem] text-secondary @min-[30rem]:block">
                      {notice}
                    </p>
                  )}
                  <button type="button" disabled={!slot} onClick={() => setStep("details")} className={PRIMARY}>
                    Continue
                    <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === "details" && slot && (
              <motion.form key="details" {...swap} onSubmit={submit} className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5 @min-[30rem]:p-6">
                <div className="flex items-center gap-3 rounded-[12px] bg-light-green-soft/60 px-4 py-3">
                  <span className="size-2 shrink-0 rounded-full bg-primary" />
                  <p className="min-w-0 flex-1 text-[0.88rem] leading-snug text-ink">
                    <span className="font-medium">{format(parseISO(dayKey(new Date(slot), tz)), "EEEE, d MMMM")}</span>
                    <span className="text-ink/55">
                      {" "}
                      &middot; {span(slot, tz)} &middot; {zoneName(tz, "short", Date.parse(slot))}
                    </span>
                  </p>
                  <button type="button" onClick={() => setStep("time")} className={cn(LINK, "shrink-0")}>
                    Change
                  </button>
                </div>

                <div className="mt-5 grid gap-3.5 @min-[30rem]:grid-cols-2">
                  <Field label="Your name">
                    <input name="name" required autoComplete="name" maxLength={120} className={cn(INPUT, "h-11")} placeholder="Ada Lovelace" />
                  </Field>
                  <Field label="Company">
                    <input name="company" required autoComplete="organization" maxLength={160} className={cn(INPUT, "h-11")} placeholder="Acme AI" />
                  </Field>
                  <div className="@min-[30rem]:col-span-2">
                    <Field label="Work email">
                      <input name="email" type="email" required autoComplete="email" maxLength={200} className={cn(INPUT, "h-11")} placeholder="you@company.com" />
                    </Field>
                  </div>
                  <div className="@min-[30rem]:col-span-2">
                    <Field label="What would you like to talk about?" optional>
                      <textarea name="notes" rows={3} maxLength={1500} className={cn(INPUT, "block resize-none py-2.5 leading-relaxed")} placeholder="Your product, what you've tried, what you want to happen next." />
                    </Field>
                  </div>
                </div>
                {/* Hidden from people; bots fill it in. */}
                <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />

                <div className="mt-auto flex items-center gap-4 pt-5">
                  <p role="alert" className="min-w-0 flex-1 text-[0.84rem] text-secondary">
                    {notice}
                  </p>
                  <button type="submit" disabled={pending} className={PRIMARY}>
                    {pending ? "Booking…" : "Confirm booking"}
                    {!pending && <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />}
                  </button>
                </div>
              </motion.form>
            )}

            {step === "done" && booking && (
              <motion.div key="done" {...swap} className="flex flex-1 flex-col justify-center p-6 @min-[30rem]:px-8">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-primary text-ink">
                    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4">
                      <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <h2 className="text-[1.6rem] leading-tight font-medium tracking-[-0.035em] text-ink">You&rsquo;re booked.</h2>
                </div>
                <dl className="mt-6 divide-y divide-ink/[0.07] border-y border-ink/[0.07] text-[0.9rem]">
                  {[
                    ["When", `${format(parseISO(dayKey(new Date(booking.start), tz)), "EEEE, d MMMM")} · ${span(booking.start, tz)} · ${zoneName(tz, "short", Date.parse(booking.start))}`],
                    ["With", `${FOUNDER.name}, ${FOUNDER.title}`],
                    ["Where", "Video call, link in your invite"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-4 py-3">
                      <dt className="w-14 shrink-0 font-mono text-[0.64rem] leading-[1.55rem] tracking-[0.1em] text-ink/40 uppercase">{k}</dt>
                      <dd className="text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-5 text-[0.88rem] leading-relaxed text-ink/60">
                  {booking.mock ? (
                    <>
                      <span className="font-mono text-[0.64rem] tracking-[0.1em] text-secondary uppercase">Preview mode</span> &middot; Cal.com isn&rsquo;t connected yet, so no invite was sent.
                    </>
                  ) : (
                    <>
                      A calendar invite is on its way to <span className="text-ink">{booking.email}</span>.
                    </>
                  )}
                </p>
                <button type="button" onClick={reset} className={cn(LINK, "mt-5 self-start")}>
                  Book another time
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </MotionConfig>
  );
}
