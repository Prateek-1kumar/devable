"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import logo from "../../public/brand/devable-logo.png";
import ArcButton from "./ArcButton";
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
  { name: "Services", link: "#services", dropdown: true },
  { name: "Case Studies", link: "#case-studies" },
  { name: "Resources", link: "#resources", dropdown: true },
  { name: "Company", link: "#company", dropdown: true },
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
        {/* The CTA keeps the site's color-wave hover (ArcButton). */}
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
          {LINKS.map((item) => (
            <a key={item.name} href={item.link} onClick={() => setOpen(false)} className="text-lg text-foreground/80">
              {item.name}
            </a>
          ))}
          <ArcButton href="#contact" arrow className="mt-2 w-full">
            Speak With Us
          </ArcButton>
        </MobileNavMenu>
      </MobileNav>
    </ResizableNavbar>
  );
}
