// Everything on the careers page that changes over time. Open roles are plain data so a CMS fetch can
// replace this array without touching the layout. ponytail: static until the CMS exists; swap ROLES for
// the CMS query (same shape) when it does.

export type Role = {
  title: string;
  summary: string;
  /** The role's full description (a CMS page, Ashby/Lever link, or a mailto until those exist). */
  href: string;
};

export const HIRING_EMAIL = "hr@devable.ai";

export const ROLES: Role[] = [
  {
    title: "Founding GTM Engineer",
    summary: "Help build the systems behind how Devable finds, reaches, and works with the companies we want to serve.",
    href: `mailto:${HIRING_EMAIL}?subject=${encodeURIComponent("Founding GTM Engineer")}`,
  },
];

// Client names, matched against the logo files (components/ui/logo-cloud-2 plus the two added in Careers).
export const TRUSTED = [
  "Vercel",
  "Glean",
  "Mistral AI",
  "AssemblyAI",
  "webAI",
  "LandingAI",
  "LangWatch",
  "Telnyx",
  "Statsig",
  "Twelve Labs",
  "Firecrawl",
  "Krisp",
];
