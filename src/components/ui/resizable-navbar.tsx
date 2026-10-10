"use client";

// Resizable navbar, adapted from the 21st.dev / Aceternity component: full width at the top of the
// page, then it settles into a frosted floating pill once you scroll past 100px.
// Adapted to this codebase: our `cn` is a plain join (no tailwind-merge), so conflicting classes are
// chosen up front instead of overridden; icons are inline SVGs instead of @tabler/icons-react.

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

const FLOAT_SHADOW =
  "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset";
const SPRING = { type: "spring", stiffness: 200, damping: 50 } as const;

type WithVisible = { visible?: boolean };

export function Navbar({ children, className }: { children: React.ReactNode; className?: string }) {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setVisible(y > 100));

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 w-full pt-3", className)}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<WithVisible>, { visible }) : child,
      )}
    </header>
  );
}

export function NavBody({ children, className, visible }: { children: React.ReactNode; className?: string } & WithVisible) {
  return (
    <motion.nav
      animate={{
        backdropFilter: visible ? "blur(10px)" : "blur(0px)",
        boxShadow: visible ? FLOAT_SHADOW : "none",
        width: visible ? "62%" : "100%",
        y: visible ? 12 : 0,
      }}
      transition={SPRING}
      style={{ minWidth: 860 }}
      className={cn(
        "relative z-[60] mx-auto hidden max-w-7xl flex-row items-center justify-between rounded-full px-4 py-2.5 transition-colors lg:flex",
        visible ? "bg-white/80" : "bg-transparent",
        className,
      )}
    >
      {children}
    </motion.nav>
  );
}

export type NavItem = { name: string; link: string; dropdown?: boolean };

export function NavItems({ items, className, onItemClick }: { items: NavItem[]; className?: string; onItemClick?: () => void }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <ul
      onMouseLeave={() => setHovered(null)}
      className={cn("absolute inset-0 hidden flex-row items-center justify-center gap-1 text-[0.95rem] lg:flex", className)}
    >
      {items.map((item, idx) => (
        <li key={item.name}>
          <a
            href={item.link}
            onMouseEnter={() => setHovered(idx)}
            onClick={onItemClick}
            className="relative inline-flex items-center gap-1 px-4 py-2 text-foreground/75 transition-colors hover:text-foreground"
          >
            {hovered === idx && <motion.span layoutId="nav-hovered" className="absolute inset-0 rounded-full bg-ink/[0.06]" />}
            <span className="relative z-10">{item.name}</span>
            {item.dropdown && (
              // ponytail: chevron only; menus come when their content exists.
              <svg aria-hidden="true" viewBox="0 0 12 12" className="relative z-10 size-3">
                <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function MobileNav({ children, className, visible }: { children: React.ReactNode; className?: string } & WithVisible) {
  return (
    <motion.nav
      animate={{
        backdropFilter: visible ? "blur(10px)" : "blur(0px)",
        boxShadow: visible ? FLOAT_SHADOW : "none",
        width: visible ? "92%" : "100%",
        paddingLeft: visible ? 12 : 16,
        paddingRight: visible ? 12 : 16,
        borderRadius: visible ? 16 : 32,
        y: visible ? 12 : 0,
      }}
      transition={SPRING}
      className={cn(
        "relative z-50 mx-auto flex max-w-[calc(100vw-2rem)] flex-col items-center justify-between py-2 lg:hidden",
        visible ? "bg-white/80" : "bg-transparent",
        className,
      )}
    >
      {children}
    </motion.nav>
  );
}

export function MobileNavHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex w-full flex-row items-center justify-between", className)}>{children}</div>;
}

export function MobileNavMenu({ children, className, isOpen }: { children: React.ReactNode; className?: string; isOpen: boolean }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ boxShadow: FLOAT_SHADOW }}
          className={cn("absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start gap-4 rounded-2xl bg-white px-5 py-7", className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MobileNavToggle({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-label={isOpen ? "Close menu" : "Open menu"} aria-expanded={isOpen} onClick={onClick} className="p-1 text-ink">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        {isOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
      </svg>
    </button>
  );
}
