"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import type { CSSProperties } from "react";
import mark from "../../public/brand/devable-mark.png";
import ArcButton from "./ArcButton";

// ponytail: dropdown items show a chevron only; menus come when their content exists.
const LINKS = [
  { label: "Services", href: "#services", dropdown: true },
  { label: "Case Studies", href: "#case-studies", dropdown: false },
  { label: "Resources", href: "#resources", dropdown: true },
  { label: "Company", href: "#company", dropdown: true },
];

// Scroll distance (px) over which the hero-size wordmark shrinks into the nav.
const SHRINK_BY = 260;

// The icon stays put in the nav; only the wordmark text travels. At the top its font
// size is --big × nav size, it is dropped by --dy into the hero and pulled left by --dx
// (icon + gap) onto the page edge; --p (0 → 1 with scroll) eases all three back.
// Font size animates instead of scale so the text re-renders crisp at every size.
const WORDMARK =
  "absolute top-1/2 left-8 leading-none whitespace-nowrap [--dx:-2rem] " +
  "[--big:3] [--dy:6rem] lg:[--big:6] lg:[--dy:8.5rem] " +
  "[font-size:calc(1.25rem*(var(--big)-(var(--big)-1)*var(--p)))] " +
  "[translate:calc((1-var(--p))*var(--dx))_calc(-50%+(1-var(--p))*var(--dy))]";

export default function Navbar() {
  const { scrollY } = useScroll();
  const p = useTransform(scrollY, [0, SHRINK_BY], [0, 1]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-transparent">
      <nav className="flex items-center gap-10 px-6 py-5 sm:px-12">
        <Link href="/" aria-label="Devable AI home" className="relative flex shrink-0 items-center gap-2 font-heading font-semibold tracking-[-0.045em] text-foreground">
          <Image src={mark} alt="" priority className="size-6 rounded-[22%]" />
          {/* Invisible nav-size copy keeps the link's layout width; the moving copy sits over it. */}
          <span className="invisible text-xl leading-none">Devable AI</span>
          <motion.span style={{ "--p": p } as unknown as CSSProperties} className={WORDMARK}>
            Devable AI
          </motion.span>
        </Link>
        <ul className="ml-auto hidden items-center gap-8 md:flex">
          {LINKS.map(({ label, href, dropdown }) => (
            <li key={label}>
              <Link href={href} className="inline-flex items-center gap-1 text-foreground">
                {label}
                {dropdown && (
                  <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3">
                    <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </Link>
            </li>
          ))}
        </ul>
        <ArcButton href="#contact" className="ml-auto text-sm md:ml-0">
          Speak With Us
        </ArcButton>
      </nav>
    </header>
  );
}
