import Link from "next/link";
import ArcButton from "./ArcButton";

// ponytail: dropdown items show a chevron only; menus come when their content exists.
const LINKS = [
  { label: "Services", href: "#services", dropdown: true },
  { label: "Case Studies", href: "#case-studies", dropdown: false },
  { label: "Resources", href: "#resources", dropdown: true },
  { label: "Company", href: "#company", dropdown: true },
];

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-transparent">
      <nav className="flex items-center gap-10 px-6 py-5 sm:px-12">
        <Link href="/" className="font-display text-2xl text-foreground">
          DEVABLE
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
