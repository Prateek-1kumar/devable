"use client";

// shadcn's navigation-menu (the ReUI variant), on the Radix primitive: hover/focus to open, arrow keys between
// items, Escape to close, focus returned to the trigger. Adapted to this codebase: shadcn's theme tokens
// (popover, accent, muted-foreground, ring) are mapped to the site's own palette, our `cn` is a plain join
// (no tailwind-merge) so classes are chosen up front rather than overridden, and the open/close motion is
// the keyframes and classes in this file (open, close, and the slide between menus) instead of tw-animate-css.

import * as React from "react";
import { cva } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

// The panel's keyframes, defined here so the whole motion lives in this file; one <style> serves every panel.
const KEYFRAMES = `
@keyframes nav-menu-in { from { opacity: 0; transform: translateY(-10px) scale(0.95); } }
@keyframes nav-menu-out { to { opacity: 0; transform: translateY(-6px) scale(0.97); } }
@keyframes nav-menu-from-start { from { opacity: 0; transform: translateX(-28px); } }
@keyframes nav-menu-from-end { from { opacity: 0; transform: translateX(28px); } }
@keyframes nav-menu-to-start { to { opacity: 0; transform: translateX(-28px); } }
@keyframes nav-menu-to-end { to { opacity: 0; transform: translateX(28px); } }
@keyframes nav-menu-row { from { opacity: 0; transform: translateY(8px); } }
`;

function NavigationMenu({
  className,
  children,
  viewport = true,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root> & { viewport?: boolean }) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      data-viewport={viewport}
      className={cn("group/navigation-menu relative flex flex-1 items-center justify-center", className)}
      {...props}
    >
      <style>{KEYFRAMES}</style>
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenuPrimitive.Root>
  );
}

function NavigationMenuList({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn("group flex flex-1 list-none items-center justify-center gap-1", className)}
      {...props}
    />
  );
}

function NavigationMenuItem({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return <NavigationMenuPrimitive.Item data-slot="navigation-menu-item" className={cn("relative", className)} {...props} />;
}

const navigationMenuTriggerStyle = cva(
  "group relative inline-flex cursor-pointer items-center justify-center gap-1 rounded-full px-4 py-2 text-[0.95rem] text-foreground/75 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50 data-[state=open]:text-foreground",
);

function NavigationMenuTrigger({ className, children, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), className)}
      {...props}
    >
      {children}
      <ChevronDownIcon
        aria-hidden="true"
        className="relative top-px z-10 size-3.5 opacity-60 transition duration-300 group-data-[state=open]:rotate-180"
      />
    </NavigationMenuPrimitive.Trigger>
  );
}

function NavigationMenuContent({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "top-0 left-0 w-full md:absolute md:w-auto",
        // Without the shared viewport, each panel is its own popover under its trigger.
        "group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-3 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-2xl group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:border-black/[0.06] group-data-[viewport=false]/navigation-menu:bg-white group-data-[viewport=false]/navigation-menu:p-1.5 group-data-[viewport=false]/navigation-menu:text-ink group-data-[viewport=false]/navigation-menu:shadow-[0_24px_50px_-20px_rgb(23_44_33/0.35)]",
        "origin-top-left motion-reduce:animate-none motion-reduce:[&_li]:animate-none",
        // Opens by unfolding from under its trigger, rows following one after another; closes quicker than it opens.
        "data-[state=open]:not-data-[motion]:animate-[nav-menu-in_360ms_cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:not-data-[motion]:animate-[nav-menu-out_180ms_ease-out_forwards]",
        // Moving to a neighbouring menu (Radix sets data-motion): the two panels slide past each other, not cut.
        "data-[motion=from-start]:animate-[nav-menu-from-start_320ms_cubic-bezier(0.16,1,0.3,1)] data-[motion=from-end]:animate-[nav-menu-from-end_320ms_cubic-bezier(0.16,1,0.3,1)] data-[motion=to-start]:animate-[nav-menu-to-start_200ms_ease-in_forwards] data-[motion=to-end]:animate-[nav-menu-to-end_200ms_ease-in_forwards]",
        "data-[state=open]:[&_li]:animate-[nav-menu-row_460ms_cubic-bezier(0.16,1,0.3,1)_both] data-[state=open]:[&_li:nth-child(1)]:[animation-delay:70ms] data-[state=open]:[&_li:nth-child(2)]:[animation-delay:120ms] data-[state=open]:[&_li:nth-child(3)]:[animation-delay:170ms] data-[state=open]:[&_li:nth-child(4)]:[animation-delay:220ms] data-[state=open]:[&_li:nth-child(5)]:[animation-delay:270ms]",
        className,
      )}
      {...props}
    />
  );
}

function NavigationMenuViewport({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <div className="absolute top-full left-0 isolate z-50 flex justify-center">
      <NavigationMenuPrimitive.Viewport
        data-slot="navigation-menu-viewport"
        className={cn(
          "relative mt-3 h-[var(--radix-navigation-menu-viewport-height)] w-full origin-top overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-1.5 text-ink shadow-[0_24px_50px_-20px_rgb(23_44_33/0.35)] data-[state=open]:animate-[nav-pop-in_180ms_cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:animate-[nav-pop-out_120ms_ease-in_forwards] md:w-[var(--radix-navigation-menu-viewport-width)]",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function NavigationMenuLink({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        // Layout and surfaces are left to the caller (no tailwind-merge to override them with).
        "outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/50",
        className,
      )}
      {...props}
    />
  );
}

function NavigationMenuIndicator({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  return (
    <NavigationMenuPrimitive.Indicator
      data-slot="navigation-menu-indicator"
      className={cn("top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden", className)}
      {...props}
    >
      <div className="relative top-[60%] size-2 rotate-45 rounded-tl-sm bg-black/10 shadow-md" />
    </NavigationMenuPrimitive.Indicator>
  );
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
};
