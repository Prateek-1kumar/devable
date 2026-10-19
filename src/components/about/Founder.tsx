"use client";

import { motion } from "motion/react";
import Image from "next/image";
import photo from "../../../public/about/founder.jpg";
import { SOCIAL } from "../Footer";

// TODO(founder): real URLs; add a Newsletter link if it's separate from AI Engineering.
const LINKS = [
  { label: "LinkedIn", href: "#", icon: SOCIAL[0].icon },
  { label: "X / Twitter", href: "#", icon: SOCIAL[1].icon },
  { label: "AI Engineering", href: "#", icon: null },
];

// The founder, compact enough to sit in one viewport, on the same columns as "Who we are" above: a single
// portrait card (his name and links on a glass plate) in the label column, the brief's words in the text column.
export default function Founder() {
  return (
    <section aria-labelledby="founder-title" className="@container px-6 pb-28 sm:px-12 sm:pb-36 xl:px-[6vw]">
      <div className="mx-auto grid max-w-[76rem] items-center gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="w-full max-w-[20rem] justify-self-center lg:col-span-5 lg:justify-self-start lg:ml-[calc(min(0px,(76rem-100cqw)/2)+2.5vw)]">
          <PortraitCard />
        </div>

        <div className="max-w-[38rem] lg:col-span-7">
          <h2
            id="founder-title"
            className="text-[clamp(1.7rem,2.6vw,2.35rem)] leading-[1.08] font-medium tracking-[-0.04em] text-ink"
          >
            Built by someone who understands both the product and the audience.
          </h2>
          <div className="mt-7 space-y-4 text-[1.02rem] leading-relaxed text-ink/70">
            <p>
              Sumanth is a developer, technical creator, and growth operator who has spent years building and creating
              for AI and developer audiences.
            </p>
            <p>
              Through his personal platforms and AI Engineering, he has built an audience of more than 200K developers,
              engineers, and AI practitioners across LinkedIn, X, and the newsletter.
            </p>
            <p>
              That experience became the foundation for Devable: a growth partner built specifically for companies
              selling technical products to technical audiences.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PortraitCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ type: "spring", bounce: 0.3, duration: 0.9 }}
      className="relative aspect-[4/5] w-full rounded-[1.5rem] bg-black shadow-[0_40px_80px_-40px_rgb(23_44_33/0.55)]"
    >
      <div className="absolute inset-0 overflow-hidden rounded-[1.5rem]">
        <Image
          src={photo}
          alt="Sumanth Papareddy"
          fill
          sizes="20rem"
          placeholder="blur"
          className="object-cover object-[50%_35%]"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div
        className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 rounded-[1rem] border border-white/15 bg-white/10 px-4 py-3.5 backdrop-blur-md"
      >
        <div className="min-w-0">
          <h3 className="text-[1.05rem] leading-tight font-medium tracking-[-0.02em] text-white">Sumanth Papareddy</h3>
          <p className="mt-0.5 text-[0.8rem] text-white/60">Founder &amp; CEO, Devable</p>
        </div>
        <nav aria-label="Sumanth online" className="-mr-1 flex shrink-0 items-center">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              aria-label={`Sumanth on ${l.label}`}
              title={l.label}
              className="grid size-7 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {l.icon ? (
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
                  {l.icon}
                </svg>
              ) : (
                <span aria-hidden="true" className="text-[0.62rem] font-semibold tracking-[0.02em]">
                  AI
                </span>
              )}
            </a>
          ))}
        </nav>
      </div>
    </motion.div>
  );
}
