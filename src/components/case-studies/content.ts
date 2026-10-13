export const TITLE = "See our work in action.";
export const INTRO =
  "We partner with AI and developer companies to build visibility and reach audiences through technical content, search, communities, and creators.";

// ponytail: points at this section until a case studies index page exists.
export const VIEW_ALL_HREF = "#case-studies";

export type Metric = { value: string; label: string };

export type CaseStudy = {
  slug: string;
  company: string;
  /** Logo in /public; without one the company name is set as a wordmark. `mark: true` means the file is an
   *  icon only, so the name is set beside it. */
  logo?: { src: string; width: number; height: number; mark?: boolean };
  /** The client's own brand color: tints the chart, tag dots, and quote mark. */
  accent: string;
  headline: string;
  services: string[];
  description: string;
  /** The headline result, drawn as the chart. `series` is one value per month of the engagement. */
  result: Metric & { series: number[] };
  metrics: [Metric, Metric];
  quote: { text: string; by: string };
  href?: string;
};

// SAMPLE DATA: every result, metric, chart series, and quote below is a realistic placeholder chosen to
// judge the design. Replace each with the client-approved figures and quotes before this ships.
export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "reflex",
    company: "Reflex",
    logo: { src: "/clients/reflex.svg", width: 81, height: 16 },
    accent: "#6e56cf",
    headline: "Building awareness for an AI developer product.",
    services: ["Technical Content", "Creator Distribution"],
    description:
      "Devable helped Reflex improve developer awareness through technical content and distribution initiatives designed to reach the right audience.",
    result: { value: "+212%", label: "Organic developer traffic", series: [100, 112, 131, 158, 196, 251, 312] },
    metrics: [
      { value: "48", label: "Technical articles and tutorials" },
      { value: "1.4M", label: "Creator video views" },
    ],
    quote: {
      text: "The content reads like our own engineers wrote it, and it reached the Python developers we had been trying to reach for a year.",
      by: "Growth lead, Reflex",
    },
  },
  {
    slug: "clarifai",
    company: "Clarifai",
    logo: { src: "/clients/clarifai.svg", width: 24, height: 24, mark: true },
    accent: "#1955ff",
    headline: "Helping developers understand and adopt AI infrastructure.",
    services: ["Technical Content", "Search & AI Visibility"],
    description:
      "Devable partnered with Clarifai to create technical content and developer-focused campaigns around AI infrastructure and platform capabilities.",
    result: { value: "3.2×", label: "Citations in AI answers", series: [10, 12, 15, 17, 22, 27, 32] },
    metrics: [
      { value: "Top 3", label: "Rankings across 40+ AI infrastructure keywords" },
      { value: "65", label: "Technical guides published" },
    ],
    quote: {
      text: "They learned our platform well enough to explain it more clearly than our own docs. Developers now find us through search and AI answers.",
      by: "Developer marketing, Clarifai",
    },
  },
];
