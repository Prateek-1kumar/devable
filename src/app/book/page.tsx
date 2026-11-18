import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Highlight from "@/components/Highlight";
import Scheduler from "@/components/book/Scheduler";
import Testimonials from "@/components/book/Testimonials";
import { INTRO, LOGOS } from "@/components/book/content";
import logo from "../../../public/brand/devable-logo.png";

export const metadata: Metadata = {
  title: "Book a call | Devable",
  description: "Book a 30-minute call with Sumanth, founder of Devable.",
};

// Book a Call: no navbar, no footer (the Navbar hides itself here), just the mark, and on desktop the whole page in
// one viewport. A split canvas inside a hairline frame: the left on warm paper (heading, a rotating client quote, the
// logo wall), the right on a faint dotted canvas holding one tall card, Sumanth's note on top of the booking itself.
// On small screens the order is heading, booking, proof, so the calendar comes right after the heading.
export default function BookPage() {
  return (
    <main className="flex-1 bg-white">
      <div className="mx-auto grid max-w-[90rem] border-line min-[90rem]:border-x lg:h-dvh lg:min-h-[42rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:grid-rows-[auto_minmax(0,1fr)]">
        {/* Intro */}
        <div className="bg-paper px-6 pt-6 pb-8 sm:px-12 lg:border-r lg:border-line lg:px-12 lg:pb-0 xl:px-16">
          <Link href="/" aria-label="Devable home" className="inline-block">
            <Image src={logo} alt="" priority className="h-[22px] w-auto" />
          </Link>
          <div className="mt-10 lg:mt-[clamp(1.5rem,5vh,3.5rem)]">
            <p className="w-fit rounded-[4px] bg-ink/[0.06] px-2.5 py-1 text-[0.78rem] tracking-[0.04em] text-ink/80 uppercase motion-safe:animate-fade-up lg:[@media(max-height:760px)]:hidden">
              {INTRO.label}
            </p>
            <h1
              className="mt-5 text-[clamp(3rem,min(5.2vw,9vh),4.75rem)] lg:[@media(max-height:760px)]:mt-0 leading-[0.95] font-medium tracking-[-0.055em] text-ink motion-safe:animate-fade-up"
              style={{ animationDelay: "80ms" }}
            >
              Let&rsquo;s{" "}
              <Highlight tone="brand" delay={0.35}>
                talk
              </Highlight>
              .
            </h1>
            <p
              className="mt-5 max-w-[29rem] text-[1rem] leading-relaxed text-pretty text-ink/60 motion-safe:animate-fade-up"
              style={{ animationDelay: "160ms" }}
            >
              {INTRO.body}
            </p>
          </div>
        </div>

        {/* Booking: spans both rows on desktop and fills the column's height. */}
        <div className="relative isolate flex px-4 py-6 sm:px-10 lg:row-span-2 lg:items-center lg:px-10 lg:py-[clamp(1rem,3vh,2rem)] xl:px-14">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(rgb(23_120_70/0.16)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,#000_35%,transparent_100%)]"
          />
          <div className="mx-auto flex w-full max-w-[38rem] motion-safe:animate-fade-up" style={{ animationDelay: "200ms" }}>
            <Scheduler />
          </div>
        </div>

        {/* Proof: a rotating quote, then the logo wall flush to the bottom. */}
        <div className="flex min-h-0 flex-col justify-end border-t border-line bg-paper lg:border-t-0 lg:border-r">
          <div className="px-6 py-10 sm:px-12 lg:px-12 lg:pt-7 lg:pb-[clamp(1.25rem,3.5vh,2.5rem)] xl:px-16">
            <Testimonials />
          </div>
          <div>
            <p className="px-6 pb-3 font-mono text-[0.66rem] tracking-[0.1em] text-ink/45 uppercase sm:px-12 lg:px-12 xl:px-16">Trusted by teams at</p>
            <ul className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-4">
              {LOGOS.map((l) => (
                <li key={l.src} className="group grid h-14 place-items-center bg-paper">
                  {/* eslint-disable-next-line @next/next/no-img-element -- per-logo heights tuned by eye (logo-cloud-2) */}
                  <img
                    src={l.src}
                    alt={l.alt}
                    style={{ height: Math.round(l.h * 0.72) }}
                    className="w-auto max-w-[70%] object-contain opacity-55 grayscale transition-[opacity,filter] duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
