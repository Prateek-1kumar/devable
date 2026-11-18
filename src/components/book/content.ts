import { TESTIMONIAL as KRISP } from "../services/content/content";
import { TESTIMONIAL as GLEAN } from "../services/influencer/content";
import { LOGOS as ALL_LOGOS } from "../ui/logo-cloud-2";

// Copy and proof for the Book a Call page (/book).

export const INTRO = {
  label: "Book a call",
  body: "A 30-minute call with Sumanth, founder of Devable. We’ll look at where your product shows up today across search, AI answers, communities, and creators, and what to build first.",
};

export type Quote = { quote: string; name?: string; role: string; company: string; logo: string; photo?: string; initials: string };

export const QUOTES: Quote[] = [
  { quote: GLEAN.quote, name: GLEAN.name, role: GLEAN.role, company: GLEAN.company, logo: GLEAN.logo, photo: GLEAN.photo, initials: GLEAN.initials },
  // Krisp's photo is not in the repo yet, so this one shows initials.
  { quote: KRISP.quote, name: KRISP.name, role: KRISP.role, company: KRISP.company, logo: KRISP.logo, initials: KRISP.initials },
  // SAMPLE: this LangWatch line comes from the Influencer case study, which is flagged as placeholder copy. Swap in an
  // approved quote (with the person's name) before launch.
  {
    quote: "Every creator actually used the product before posting. It read like our community talking, not an ad buy.",
    role: "Co-founder",
    company: "LangWatch",
    logo: "/clients/langwatch.svg",
    initials: "LW",
  },
];

/** Eight marks for the wall: two rows of four. */
export const LOGOS = ALL_LOGOS.slice(0, 8);

// The booking card's header: who you'll meet, in his voice (modelled on the Scalerrs founder band the client shared).
export const FOUNDER = {
  note: "Hi, I\u2019m Sumanth, founder of Devable. When you book, you\u2019re talking directly with me. No sales team, just a straight conversation about whether we\u2019re the right fit for your product.",
  name: "Sumanth Papareddy",
  title: "Founder & CEO",
  company: "@Devable",
  // TODO(founder): his real LinkedIn URL and follower count (e.g. "52,000"). Until the count is set the line reads
  // "Connect on LinkedIn" rather than showing a made-up number.
  linkedin: { href: "#", followers: null as string | null },
};
