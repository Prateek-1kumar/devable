import Image from "next/image";
import logo from "../../public/brand/devable-logo.png";

const TAGLINE = "Growth engines for AI-native DevTools and platforms.";

// ponytail: "#" until these pages exist; Case Studies already has its section.
const COLUMNS = [
  {
    title: "Services",
    links: [
      { label: "Technical Content", href: "#" },
      { label: "Search & AI Visibility", href: "#" },
      { label: "Reddit", href: "#" },
      { label: "Creator Distribution", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Case Studies", href: "#case-studies" },
      { label: "Careers", href: "#" },
      { label: "Partners", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "#" },
      { label: "Guides", href: "#" },
      { label: "AI Engineering", href: "#" },
    ],
  },
];

export const SOCIAL = [
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm7 0h3.8v1.5h.05c.53-1 1.83-1.75 3.4-1.75 3.6 0 4.25 2.2 4.25 5.05v6.2h-4v-5.5c0-1.3 0-2.95-1.85-2.95-1.85 0-2.15 1.4-2.15 2.85v5.6H10v-11Z" />
    ),
  },
  {
    label: "X",
    href: "#",
    icon: (
      <path d="M17.75 3h3.06l-6.69 7.65L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.16-8.18L2 3h6.33l4.37 5.78L17.75 3Zm-1.07 16.17h1.7L7.4 4.73H5.58l11.1 14.44Z" />
    ),
  },
];

// Clean, formal footer on white: one row with the logo and tagline on the left, the three link columns
// in the middle, and social icons on the right; then a hairline and the legal row.
export default function Footer() {
  return (
    <footer className="bg-white">
      <div className="px-6 pt-14 pb-10 sm:px-12 lg:pt-16 lg:pb-12 xl:px-[6vw]">
        <div className="grid gap-10 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-12">
          <div>
            <Image src={logo} alt="Devable AI" className="h-7 w-auto" />
            <p className="mt-3 max-w-[19rem] text-[0.95rem] leading-[1.55] text-balance text-muted">{TAGLINE}</p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:justify-self-center lg:gap-16">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-[0.75rem] font-medium tracking-[0.12em] text-muted uppercase">{col.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-[0.92rem] text-ink/80 transition-colors hover:text-ink">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <ul className="flex items-center gap-4 lg:self-center">
            {SOCIAL.map((s) => (
              <li key={s.label}>
                <a href={s.href} aria-label={s.label} className="block text-ink/70 transition-colors hover:text-ink">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-5">
                    {s.icon}
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-[0.88rem] text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Devable. All rights reserved.</span>
          <span className="flex gap-6">
            <a href="#" className="transition-colors hover:text-ink">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-ink">
              Terms
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
