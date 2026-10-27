"use client";

// Resizable navbar, adapted from the 21st.dev / Aceternity component: full width at the top of the
// page, then it settles into a frosted floating pill once you scroll past 100px.
// Adapted to this codebase: our `cn` is a plain join (no tailwind-merge), so conflicting classes are
// chosen up front instead of overridden; icons are inline SVGs instead of @tabler/icons-react.

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./navigation-menu";

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
      // The links are centered across the whole bar, so it needs room for the logo and CTA either side.
      style={{ minWidth: 960 }}
      className={cn(
        "relative z-[60] mx-auto hidden max-w-7xl flex-row items-center justify-between rounded-[14px] px-4 py-2.5 transition-colors lg:flex",
        visible ? "bg-white/80" : "bg-transparent",
        className,
      )}
    >
      {children}
    </motion.nav>
  );
}

/**
 * A sub-link in a dropdown; without a `link` it shows as coming soon. One sub-link can be `featured`: it takes
 * the large card on the left of the menu, with a line about it and a few faces.
 */
export type NavSubItem = { name: string; link?: string; description?: string; featured?: boolean; faces?: string[] };
export type NavItem = { name: string; link: string; dropdown?: boolean; items?: NavSubItem[] };

/** The sliding hover pill behind whichever top-level item the cursor is on. */
function Pill({ on }: { on: boolean }) {
  return on ? <motion.span layoutId="nav-hovered" className="absolute inset-0 rounded-full bg-ink/[0.06]" /> : null;
}

// The desktop links on the Radix navigation menu (components/ui/navigation-menu): items with sub-links open a
// panel on hover or focus, with arrow keys, Escape and focus return handled. Centered across the whole bar.
export function NavItems({ items, className, onItemClick }: { items: NavItem[]; className?: string; onItemClick?: () => void }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div onMouseLeave={() => setHovered(null)} className={cn("absolute inset-0 hidden items-center justify-center lg:flex", className)}>
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          {items.map((item, idx) => (
            <NavigationMenuItem key={item.name} onMouseEnter={() => setHovered(idx)}>
              {item.items ? (
                <>
                  <NavigationMenuTrigger>
                    <Pill on={hovered === idx} />
                    <span className="relative z-10">{item.name}</span>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ServicesPanel items={item.items} onItemClick={onItemClick} />
                  </NavigationMenuContent>
                </>
              ) : (
                <NavigationMenuLink href={item.link} onClick={onItemClick} className={navigationMenuTriggerStyle()}>
                  <Pill on={hovered === idx} />
                  <span className="relative z-10">{item.name}</span>
                  {item.dropdown && (
                    // ponytail: chevron only on items whose menus don't exist yet.
                    <svg aria-hidden="true" viewBox="0 0 12 12" className="relative z-10 size-3">
                      <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </NavigationMenuLink>
              )}
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

/** A dropdown's panel: the featured sub-link as a large card on the left, the rest listed small on the right. */
function ServicesPanel({ items, onItemClick }: { items: NavSubItem[]; onItemClick?: () => void }) {
  const featured = items.find((s) => s.featured);
  const rest = items.filter((s) => !s.featured);
  return (
    <ul className="grid w-[40rem] grid-cols-[1fr_1.1fr] gap-1.5">
      {featured?.link && (
        <li className="row-span-3">
          <NavigationMenuLink
            href={featured.link}
            onClick={onItemClick}
            className="group/card flex h-full min-h-[15rem] flex-col justify-between rounded-xl bg-[#f6f5f0] p-5 hover:bg-[#f1efe7] focus-visible:bg-[#f1efe7]"
          >
            {featured.faces && (
              <span className="flex -space-x-2">
                {featured.faces.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element -- sample creator photos
                  <img key={src} src={src} alt="" className="size-9 rounded-full object-cover ring-2 ring-[#f6f5f0]" />
                ))}
              </span>
            )}
            <span>
              <span className="block text-[1.15rem] font-medium tracking-[-0.025em] text-ink">{featured.name}</span>
              {featured.description && <span className="mt-1.5 block text-[0.88rem] leading-snug text-ink/60">{featured.description}</span>}
              <span className="mt-4 inline-flex items-center gap-1.5 text-[0.85rem] font-medium text-ink">
                Explore
                <span aria-hidden="true" className="transition-transform duration-300 group-hover/card:translate-x-0.5">
                  →
                </span>
              </span>
            </span>
          </NavigationMenuLink>
        </li>
      )}
      {rest.map((sub) => (
        <li key={sub.name}>
          {sub.link ? (
            <NavigationMenuLink href={sub.link} onClick={onItemClick} className="block rounded-xl px-3.5 py-3 hover:bg-ink/[0.04] focus-visible:bg-ink/[0.04]">
              <span className="block text-[0.92rem] font-medium text-ink">{sub.name}</span>
              {sub.description && <span className="mt-1 block text-[0.8rem] leading-snug text-ink/55">{sub.description}</span>}
            </NavigationMenuLink>
          ) : (
            <div className="rounded-xl px-3.5 py-3">
              <span className="flex items-center justify-between gap-3">
                <span className="text-[0.92rem] font-medium text-ink/55">{sub.name}</span>
                <span className="rounded-[4px] bg-ink/[0.05] px-1.5 py-0.5 font-mono text-[0.6rem] tracking-[0.08em] text-ink/45 uppercase">Soon</span>
              </span>
              {sub.description && <span className="mt-1 block text-[0.8rem] leading-snug text-ink/40">{sub.description}</span>}
            </div>
          )}
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
