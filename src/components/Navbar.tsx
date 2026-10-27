"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import logo from "../../public/brand/devable-logo.png";
import ArcButton from "./ArcButton";
import { CREATORS } from "./services/influencer/content";
import {
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavBody,
  Navbar as ResizableNavbar,
  NavItems,
  type NavItem,
} from "./ui/resizable-navbar";

const LINKS: NavItem[] = [
  {
    name: "Services",
    link: "/services/influencer-marketing",
    // ponytail: the other three link up as their pages ship.
    items: [
      {
        name: "Influencer Marketing",
        link: "/services/influencer-marketing",
        featured: true,
        description: "Reach developers through the technical creators they already follow.",
        faces: CREATORS.slice(0, 4).map((c) => c.photo),
      },
      { name: "Technical Content", link: "/services/technical-content", description: "Docs, tutorials, and deep dives developers actually read." },
      { name: "Search & AI Visibility", link: "/services/search-ai-visibility", description: "Show up where developers search, and in AI answers." },
      { name: "Reddit", description: "Earn trust in the communities developers already use." },
    ],
  },
  { name: "Case Studies", link: "#case-studies" },
  { name: "Resources", link: "#resources", dropdown: true },
  { name: "Company", link: "#company", dropdown: true },
  { name: "About Us", link: "/about" },
];

function Logo() {
  return (
    <Link href="/" aria-label="Devable AI home" className="relative z-20 shrink-0 px-2">
      <Image src={logo} alt="" priority className="h-6 w-auto" />
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <ResizableNavbar>
      <NavBody>
        <Logo />
        <NavItems items={LINKS} />
        {/* The CTA's green icon box grows to fill it on hover (ArcButton). */}
        <ArcButton href="#contact" size="sm" arrow className="relative z-20">
          Speak With Us
        </ArcButton>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <Logo />
          <MobileNavToggle isOpen={open} onClick={() => setOpen(!open)} />
        </MobileNavHeader>
        <MobileNavMenu isOpen={open}>
          {LINKS.map((item) =>
            item.items ? (
              <div key={item.name} className="w-full">
                <p className="text-lg text-foreground/80">{item.name}</p>
                <ul className="mt-2 space-y-2 border-l border-ink/10 pl-4">
                  {item.items.map((sub) => (
                    <li key={sub.name}>
                      {sub.link ? (
                        <a href={sub.link} onClick={() => setOpen(false)} className="text-[0.98rem] text-foreground/80">
                          {sub.name}
                        </a>
                      ) : (
                        <span className="text-[0.98rem] text-foreground/40">{sub.name} · soon</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <a key={item.name} href={item.link} onClick={() => setOpen(false)} className="text-lg text-foreground/80">
                {item.name}
              </a>
            ),
          )}
          <ArcButton href="#contact" arrow className="mt-2 w-full">
            Speak With Us
          </ArcButton>
        </MobileNavMenu>
      </MobileNav>
    </ResizableNavbar>
  );
}
