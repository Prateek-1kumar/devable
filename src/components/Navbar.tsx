import Image from "next/image";
import Link from "next/link";
import logo from "../../public/brand/devable-logo.png";
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
      {/* Side padding matches the hero's, so the logo lines up with the headline. */}
      <nav className="flex items-center gap-10 px-6 py-6 sm:px-12 lg:px-[8vw]">
        <Link href="/" aria-label="Devable AI home" className="shrink-0">
          <Image src={logo} alt="" priority className="h-6 w-auto" />
        </Link>
        <ul className="ml-auto hidden items-center gap-8 text-[0.95rem] md:flex">
          {LINKS.map(({ label, href, dropdown }) => (
            <li key={label}>
              <Link href={href} className="inline-flex items-center gap-1 text-foreground/80 transition-colors hover:text-foreground">
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
        <ArcButton href="#contact" size="sm" arrow className="ml-auto md:ml-0">
          Speak With Us
        </ArcButton>
      </nav>
    </header>
  );
}
