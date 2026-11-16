import Image from "next/image";
import Link from "next/link";
import HalftoneWordmarkFooter from "@/components/ui/halftone-wordmark-footer";
import logo from "../../public/brand/devable-logo.png";
import { HIRING_EMAIL } from "./careers/content";

const TAGLINE = "Growth engines for AI-native DevTools and platforms.";

// ponytail: Partners and AI Engineering stay "#" until those pages exist.
const COLUMNS = [
  {
    title: "Services",
    links: [
      { label: "Technical Content", href: "/services/technical-content" },
      {
        label: "Search & AI Visibility",
        href: "/services/search-ai-visibility",
      },
      { label: "Reddit", href: "/services/reddit" },
      { label: "Creator Distribution", href: "/services/influencer-marketing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Case Studies", href: "/#case-studies" },
      { label: "Careers", href: "/careers" },
      { label: "Partners", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Guides", href: "/guides" },
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

const LABEL =
  "font-mono text-[0.72rem] tracking-[0.14em] text-white/45 uppercase";
const LINK = "text-[0.95rem] text-white/65 transition-colors hover:text-white";

// The closing page: the same near-black as the CTA band above it (so the two read as one closing block),
// with the brand, link columns and a contact tile on top, a hairline and the legal row, then the wordmark
// set enormous in white halftone dots and cropped by the page's bottom edge. The CTA lives in the band
// above, so nothing here repeats it. The dots warm to the brand green as the pointer pushes them.
export default function Footer() {
  return (
    <footer className="bg-[#0b0b0b] text-white">
      <div className="px-6 pb-8 sm:px-12 xl:px-[6vw]">
        <div className="mx-auto max-w-[76rem] border-t border-white/10 pt-12 lg:pt-14">
          <div className="grid grid-cols-2 gap-x-10 gap-y-12 lg:grid-cols-12">
            <div className="col-span-2 lg:col-span-4">
              <Image
                src={logo}
                alt="Devable AI"
                className="h-7 w-auto mix-blend-screen invert"
              />
              <p className="mt-4 max-w-[19rem] text-[1.02rem] leading-[1.5] text-balance text-white/65">
                {TAGLINE}
              </p>
              <ul className="mt-6 flex items-center gap-4">
                {SOCIAL.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      aria-label={s.label}
                      className="block text-white/60 transition-colors hover:text-white"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                        className="size-5"
                      >
                        {s.icon}
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {COLUMNS.map((col) => (
              <nav
                key={col.title}
                aria-label={col.title}
                className="lg:col-span-2"
              >
                <h3 className={LABEL}>{col.title}</h3>
                <ul className="mt-5 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("/") ? (
                        <Link href={link.href} className={LINK}>
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} className={LINK}>
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <div className="col-span-2 lg:col-span-2">
              <h3 className={LABEL}>Get in touch</h3>
              <a
                href={`mailto:${HIRING_EMAIL}`}
                className="group mt-5 flex w-fit items-center gap-3 text-[0.95rem] text-white transition-colors"
              >
                <span className="grid size-11 place-items-center rounded-[6px] bg-white/[0.08] transition-colors group-hover:bg-primary group-hover:text-ink">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    aria-hidden="true"
                    className="size-[1.15rem]"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
                  </svg>
                </span>
                {HIRING_EMAIL}
              </a>
            </div>
          </div>

          <div className="mt-14 grid gap-x-10 gap-y-3 border-t border-white/10 pt-6 text-[0.88rem] text-white/45 lg:grid-cols-12">
            <span className="lg:col-span-4">
              © {new Date().getFullYear()} Devable. All rights reserved.
            </span>
            <span className="flex gap-6 lg:col-span-8">
              <a href="#" className="transition-colors hover:text-white">
                Privacy
              </a>
              <a href="#" className="transition-colors hover:text-white">
                Terms
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* Same gutters and max width as the content above, so the word's ink lines up with the grid edges. */}
      <div className="px-6 sm:px-12 xl:px-[6vw]">
        <div className="mx-auto max-w-[76rem]">
          <HalftoneWordmarkFooter
            wordmark="devable"
            label=""
            meta=""
            columns={[]}
            backToTop={false}
            palette={{ background: "#0b0b0b", ink: "#ffffff", warm: "#19e76e" }}
            fontFamily="var(--font-instrument), 'Helvetica Neue', Arial, sans-serif"
            fontWeight={700}
            fit={1}
            height="min(16vw, 13.5rem)"
          />
        </div>
      </div>
    </footer>
  );
}
