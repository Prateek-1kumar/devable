import type { ReactNode } from "react";
import ArcButton from "../ArcButton";
import DotButton from "../DotButton";
import { Label } from "../services/kit";
import { LOGOS } from "../ui/logo-cloud-2";
import { HIRING_EMAIL, ROLES, TRUSTED } from "./content";

// The careers page, top to bottom: a type-only hero, a scrolling client strip, why Devable (paper), what we
// stand for (the inset charcoal stage, the page's anchor), how we work (paper, statements only), open roles
// (a hairline list fed from content.ts), and a dark closing band for people the list doesn't fit.

const PAD = "px-6 sm:px-12 xl:px-[6vw]";
const RISE = "animate-fade-up motion-reduce:animate-none";

/** Ink for the words that carry a grey paragraph (the About page's two-tone grammar). */
function Key({ children }: { children: ReactNode }) {
  return <span className="text-ink">{children}</span>;
}

export function CareersHero() {
  return (
    <section className={`${PAD} pt-40 pb-20 sm:pt-48 sm:pb-24`}>
      <div className="mx-auto flex max-w-[76rem] flex-col items-center text-center">
        <div style={{ animationDelay: "0ms" }} className={RISE}>
          <Label>Careers</Label>
        </div>
        <h1 className="mt-8 text-[clamp(3.25rem,8vw,7.5rem)] leading-[0.95] font-medium tracking-[-0.06em] text-ink">
          <span style={{ animationDelay: "80ms" }} className={`inline-block text-ink/30 ${RISE}`}>
            Join
          </span>{" "}
          <span style={{ animationDelay: "160ms" }} className={`inline-block ${RISE}`}>
            Devable.
          </span>
        </h1>
        <div style={{ animationDelay: "300ms" }} className={`mt-8 max-w-[40rem] ${RISE}`}>
          <p className="text-lg leading-relaxed tracking-[-0.01em] text-balance text-ink/70 sm:text-xl">
            We&rsquo;re building a small, ambitious team working closely with AI&#8209;native companies and developer tools.
          </p>
          <p className="mt-4 text-[1.02rem] leading-relaxed text-balance text-ink/50">
            Come build with us if you want meaningful responsibility, high standards, and the opportunity to do some of
            your best work.
          </p>
          <ArcButton href="#open-roles" arrow className="mt-10">
            View open roles
          </ArcButton>
        </div>
      </div>
    </section>
  );
}

// webAI and LandingAI aren't on the homepage wall, so they get their tuned heights here.
const ALL_LOGOS = [...LOGOS, { src: "/clients/webai.svg", alt: "webAI", h: 19 }, { src: "/clients/landingai.png", alt: "LandingAI", h: 24 }];
const CLIENTS = TRUSTED.map((name) => ALL_LOGOS.find((l) => l.alt === name)!);
const EDGES = "[mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]";

/** Label cell on the left, logos drifting right to left beside it; the list repeats once so −50% loops. */
export function TrustedStrip() {
  return (
    <section aria-label="Trusted by" className={PAD}>
      <div className="mx-auto flex max-w-[76rem] flex-col border-y border-line sm:flex-row sm:items-stretch">
        <p className="flex shrink-0 items-center pt-6 font-mono text-[0.72rem] tracking-[0.14em] text-muted uppercase sm:w-44 sm:border-r sm:border-line sm:py-0">
          Trusted by
        </p>
        <div className={`group flex min-w-0 flex-1 overflow-hidden py-6 sm:py-8 ${EDGES}`}>
          <ul className="flex w-max shrink-0 animate-marquee items-center group-hover:[animation-play-state:paused] motion-reduce:animate-none">
            {[...CLIENTS, ...CLIENTS].map((logo, i) => {
              const copy = i >= CLIENTS.length;
              return (
                <li key={i} aria-hidden={copy || undefined} className="grid h-12 w-44 place-items-center px-6">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static logos, mixed svg/png */}
                  <img
                    src={logo.src}
                    alt={copy ? "" : logo.alt}
                    style={{ height: logo.h }}
                    className="w-auto max-w-full object-contain opacity-75 select-none"
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** The About page's "Who we are" layout: label, claim, then the story stepped in under the claim's right side. */
export function WhyDevable() {
  return (
    <section aria-labelledby="why-devable-title" className={`${PAD} py-28 sm:py-36`}>
      <div className="mx-auto grid max-w-[76rem] gap-y-8 lg:grid-cols-12 lg:gap-y-10">
        <div className="lg:col-span-12">
          <Label>Why Devable</Label>
        </div>
        <h2
          id="why-devable-title"
          className="max-w-[14ch] text-[clamp(2.2rem,4vw,3.75rem)] leading-[1.02] font-medium tracking-[-0.05em] text-ink lg:col-span-12"
        >
          Work close to where AI is moving.
        </h2>
        <div className="mt-4 max-w-[40rem] space-y-6 text-[clamp(1.35rem,1.9vw,1.65rem)] leading-[1.45] font-medium tracking-[-0.025em] text-ink/50 lg:col-span-7 lg:col-start-6 lg:mt-6">
          <p>
            We work with companies building <Key>developer tools</Key>, <Key>AI infrastructure</Key>, and products shaping{" "}
            <Key>how software gets built and used</Key>.
          </p>
          <p>
            We&rsquo;re a small team, so the work is <Key>close to the products, clients, and decisions that matter</Key>.
            You&rsquo;ll have meaningful responsibility and <Key>the trust to do your job well</Key>.
          </p>
        </div>
      </div>
    </section>
  );
}

const VALUES = [
  { title: "High agency", line: "Take initiative. Think through the problem, make a call when you can, and move things forward." },
  {
    title: "Low ego",
    line: "Good ideas matter more than titles. Be open to feedback, change your mind when there’s a better answer, and give others the same room.",
  },
  { title: "High standards", line: "Care about the quality of what you put out. Done and good are not always the same thing." },
  { title: "Be dependable", line: "Do what you say you’ll do. If something changes, communicate early." },
  { title: "Stay curious", line: "Ask questions, learn quickly, and understand more than what sits directly inside your role." },
];

/** The page's anchor: the inset charcoal stage from About, intro pinned left, five values as large ruled rows. */
export function StandFor() {
  return (
    <section
      aria-labelledby="stand-for-title"
      className="mx-[2.5vw] rounded-[1.25rem] bg-[#1a1918] px-6 py-24 text-white sm:px-12 sm:py-32 xl:px-[6vw]"
    >
      <div className="mx-auto grid max-w-[76rem] gap-14 lg:grid-cols-12 lg:gap-x-10">
        <header className="lg:sticky lg:top-32 lg:col-span-4 lg:self-start">
          <Label dark>What we stand for</Label>
          <h2 id="stand-for-title" className="mt-6 text-[clamp(2.2rem,4vw,3.5rem)] leading-[1.02] font-medium tracking-[-0.05em]">
            The things we care about.
          </h2>
          <p className="mt-6 max-w-[22rem] text-lg leading-snug tracking-[-0.01em] text-white/50">
            These shape how we work together, the people we hire, and the standard we expect from ourselves.
          </p>
        </header>

        <ol className="border-b border-white/10 lg:col-span-7 lg:col-start-6">
          {VALUES.map(({ title, line }, i) => (
            <li key={title} className="group grid grid-cols-[2.5rem_1fr] gap-x-4 border-t border-white/10 py-8 sm:grid-cols-[3.5rem_1fr] sm:py-10">
              <span className="pt-[0.6em] font-mono text-sm text-white/35 transition-colors duration-300 group-hover:text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-[clamp(1.9rem,3.4vw,3rem)] leading-[1.05] font-medium tracking-[-0.045em]">{title}</h3>
                <p className="mt-3 max-w-[32rem] text-[1.05rem] leading-relaxed text-white/60 sm:text-lg">{line}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Statements only, no cards: three two-tone paragraphs beside the label. */
export function HowWeWork() {
  return (
    <section aria-label="How we work" className={`${PAD} py-28 sm:py-36`}>
      <div className="mx-auto grid max-w-[76rem] gap-y-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Label>How we work</Label>
        </div>
        <div className="max-w-[44rem] space-y-10 text-[clamp(1.5rem,2.3vw,2rem)] leading-[1.35] font-medium tracking-[-0.03em] text-ink/40 lg:col-span-8">
          <p>
            We keep the team <Key>small</Key>, communicate <Key>directly</Key>, and give people a lot of{" "}
            <Key>trust and flexibility</Key>.
          </p>
          <p>
            We <Key>move quickly</Key>, care about <Key>the quality of the work</Key>, and expect people to{" "}
            <Key>take responsibility for what they own</Key>.
          </p>
          <p>
            We <Key>use AI heavily</Key> across the company to research, build, and operate better, while keeping{" "}
            <Key>judgment and quality at the center</Key>.
          </p>
        </div>
      </div>
    </section>
  );
}

/** Rows from ROLES: title, one line, and the link. The count beside the heading updates with the list. */
export function OpenRoles() {
  return (
    <section id="open-roles" aria-labelledby="open-roles-title" className={`${PAD} scroll-mt-24 pb-28 sm:pb-36`}>
      <div className="mx-auto max-w-[76rem]">
        <h2 id="open-roles-title" className="flex items-start gap-3 text-[clamp(2.2rem,4vw,3.75rem)] leading-[1.02] font-medium tracking-[-0.05em] text-ink">
          Open roles
          <span className="mt-1 rounded-[4px] bg-primary px-2 py-0.5 font-mono text-sm tracking-normal text-ink">{ROLES.length}</span>
        </h2>

        <ul className="mt-12 border-t border-ink">
          {ROLES.map((role) => (
            <li key={role.title} className="border-b border-line">
              <a
                href={role.href}
                className="group grid gap-x-10 gap-y-3 py-8 outline-offset-4 md:grid-cols-12 md:items-center"
              >
                <h3 className="text-[clamp(1.5rem,2.4vw,2rem)] leading-tight font-medium tracking-[-0.04em] text-ink transition-transform duration-300 group-hover:translate-x-1 md:col-span-5">
                  {role.title}
                </h3>
                <p className="max-w-[34rem] text-[1.02rem] leading-relaxed text-ink/60 md:col-span-5">{role.summary}</p>
                <span className="inline-flex items-center gap-3 text-[0.95rem] font-medium text-ink md:col-span-2 md:justify-self-end">
                  View role
                  <span
                    aria-hidden="true"
                    className="grid size-9 place-items-center rounded-[6px] bg-ink/[0.06] transition-colors duration-300 group-hover:bg-primary"
                  >
                    →
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** The closing band, in FinalCta's near-black: an open door for people the list doesn't fit. */
export function NoRole() {
  return (
    <section aria-labelledby="no-role-title" className={`${PAD} flex min-h-[45svh] items-center bg-[#0b0b0b] py-20`}>
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <h2 id="no-role-title" className="text-[clamp(1.75rem,2.5vw,2.25rem)] leading-[1.1] font-medium tracking-[-0.035em] text-white">
            Don&rsquo;t see the right role?
          </h2>
          <p className="mt-6 max-w-[36rem] text-[1.02rem] leading-[1.65] text-white/60">
            We&rsquo;re always open to hearing from thoughtful people who think they could contribute to what we&rsquo;re
            building. Email us at <span className="text-white">{HIRING_EMAIL}</span> with a little about yourself and what
            you&rsquo;d like to work on.
          </p>
        </div>
        <DotButton href={`mailto:${HIRING_EMAIL}`} className="w-full lg:max-w-[20rem] lg:justify-self-end">
          Email {HIRING_EMAIL}
        </DotButton>
      </div>
    </section>
  );
}
