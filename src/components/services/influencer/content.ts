import type { Platform } from "../kit";

// Copy for the Influencer Marketing service page, from the copy doc.
//
// SAMPLE DATA: the hero numbers, every creator (names, handles, photos, posts, view counts), and the case
// study results and quote are placeholders to judge the design. Replace them with real campaign posts,
// creator photos, and client-approved figures before this ships.

export const HERO = {
  label: "Influencer Marketing",
  title: "Distribution is the moat.",
  body: "We help AI-native companies build distribution with creators, from product launches to ongoing campaigns.",
  // Doc: "[X]M+ impressions · [X]+ creators · [X] launches"
  stats: [
    { value: "120M+", label: "impressions" },
    { value: "300+", label: "creators" },
    { value: "60", label: "launches" },
  ],
  channels: ["x", "linkedin", "youtube", "newsletter"] as Platform[],
};

export type Creator = { name: string; handle: string; photo: string };

export const CREATORS: Creator[] = [
  { name: "Daniel Ortiz", handle: "@danortiz_ai", photo: "/services/creators/c1.jpg" },
  { name: "Maya Chen", handle: "@mayabuilds", photo: "/services/creators/c2.jpg" },
  { name: "Arjun Mehta", handle: "@arjun_codes", photo: "/services/creators/c3.jpg" },
  { name: "Sara Lind", handle: "@saralind", photo: "/services/creators/c4.jpg" },
  { name: "Tom Becker", handle: "@tbecker_dev", photo: "/services/creators/c5.jpg" },
  { name: "Ines Duarte", handle: "@inesduarte", photo: "/services/creators/c6.jpg" },
  { name: "Leo Park", handle: "@leopark_ml", photo: "/services/creators/c7.jpg" },
  { name: "Nora Weiss", handle: "@noraweiss", photo: "/services/creators/c8.jpg" },
];

// The hero's launch: one company post, amplified by creators' quote posts.
export const LAUNCH = {
  company: { name: "LangWatch", handle: "@LangWatchAI", logo: "/clients/langwatch.svg" },
  text: "Introducing LangWatch Scenarios: simulate thousands of real user conversations before your agent ships.",
  quotes: [
    { creator: 1, text: "Finally a sane way to test agents before prod. Ran it on our support bot in 10 minutes." },
    { creator: 2, text: "This is the eval workflow I wanted last year. Thread on how it works ↓" },
    { creator: 0, text: "Agent testing just got a lot less hand-wavy." },
    { creator: 5, text: "Wrote up a full walkthrough, simulations, judges, CI, the lot." },
  ],
  impressions: 1_840_000,
};

export const LOGOS = [
  { src: "/clients/glean.svg", alt: "Glean", h: 30 },
  { src: "/clients/webai.svg", alt: "webAI", h: 24 },
  { src: "/clients/liner.svg", alt: "LINER", h: 22 },
  { src: "/clients/telnyx.svg", alt: "Telnyx", h: 25 },
  { src: "/clients/langwatch.svg", alt: "LangWatch", h: 26 },
  { src: "/clients/mistral.svg", alt: "Mistral AI", h: 22 },
  { src: "/clients/assemblyai.svg", alt: "AssemblyAI", h: 24 },
  { src: "/clients/firecrawl.svg", alt: "Firecrawl", h: 26 },
  { src: "/clients/twelvelabs.svg", alt: "Twelve Labs", h: 24 },
  { src: "/clients/krisp.svg", alt: "Krisp", h: 30 },
  { src: "/clients/qodo.svg", alt: "Qodo", h: 30 },
  { src: "/clients/kilo.svg", alt: "Kilo Code", h: 34 },
];

export type Post = { creator: number; platform: Platform; client: string; text: string; views: string };

export const LAUNCHES = {
  label: "Launches we've run",
  title: "Launches we've put in front of the right people.",
  posts: [
    { creator: 0, platform: "x", client: "Glean", text: "Glean just shipped agents that actually know your company's context. Tried it on our eng wiki, genuinely useful.", views: "412K" },
    { creator: 3, platform: "linkedin", client: "webAI", text: "Running frontier models fully on-device used to be a demo. webAI made it a product. Here's what I built in a weekend.", views: "286K" },
    { creator: 6, platform: "youtube", client: "Telnyx", text: "I built a voice AI agent that answers real phone calls in under 300ms, full build with Telnyx.", views: "198K" },
    { creator: 1, platform: "x", client: "LangWatch", text: "If you ship LLM agents without simulations you are testing in prod. LangWatch Scenarios fixes that.", views: "530K" },
    { creator: 4, platform: "newsletter", client: "LINER", text: "This week: the research assistant I now use daily, and why its citations are the part that matters.", views: "94K" },
    { creator: 7, platform: "linkedin", client: "Glean", text: "Enterprise search was never the problem. Context was. Glean's new release is the first that gets that right.", views: "167K" },
  ] as Post[],
};

export const MODES = {
  label: "Two ways we work",
  title: "One launch moment, or a steady drumbeat.",
  modes: [
    {
      name: "Launch Amplification",
      body: "Concentrated attention around the moments that matter most, mainly on X and LinkedIn, where launches spread fastest.",
      fits: ["Product launches", "Major releases", "Funding announcements", "Open-source launches", "New feature announcements"],
    },
    {
      name: "Ongoing Creator Distribution",
      body: "Consistent visibility through recurring partnerships across X, LinkedIn, YouTube, and newsletters.",
      fits: ["Category awareness", "Product education", "Reaching new audiences", "Supporting ongoing GTM campaigns"],
    },
  ],
};

export type Case = {
  client: string;
  logo: string;
  outcome: string;
  stats: { value: string; label: string }[];
  summary: string;
  quote?: { text: string; by: string };
  href: string;
};

export const CASES = {
  label: "Case studies",
  title: "Launches that moved the numbers.",
  cases: [
    {
      client: "LangWatch",
      logo: "/clients/langwatch.svg",
      outcome: "A launch week that reached every agent builder on X.",
      stats: [
        { value: "24", label: "creators" },
        { value: "3.1M", label: "impressions" },
        { value: "4.6×", label: "signups vs. last launch" },
      ],
      summary:
        "LangWatch needed its Scenarios launch to land with engineers shipping agents. We matched 24 technical creators to the launch and sequenced posts, deep dives, and quote posts across 72 hours.",
      quote: {
        text: "Every creator actually used the product before posting. It read like our community talking, not an ad buy.",
        by: "Co-founder, LangWatch",
      },
      href: "#",
    },
    {
      client: "webAI",
      logo: "/clients/webai.svg",
      outcome: "Steady visibility for on-device AI, month after month.",
      stats: [
        { value: "18", label: "creators" },
        { value: "6.4M", label: "impressions" },
        { value: "+38%", label: "branded search" },
      ],
      summary:
        "webAI wanted developers to understand local AI, not just hear about it. We ran a recurring program of tutorials and explainers across YouTube, LinkedIn, and newsletters.",
      href: "#",
    },
  ] as Case[],
};

export const PROCESS = {
  label: "How we run it",
  title: "From creator selection to campaign execution, we run the whole system.",
  steps: [
    {
      title: "Find the right creators",
      body: "We pick creators based on technical credibility, audience fit, content quality, and past performance, not follower count.",
    },
    {
      title: "Build the right narrative",
      body: "The same product should not sound identical through every creator. We define the angle and key messages, and leave room for each creator to speak in their own voice.",
    },
    {
      title: "Coordinate the distribution",
      body: "We handle outreach, negotiation, scheduling, approvals, and execution. For launches, timing matters: creators play different roles, from the first launch posts to deep dives, quote posts, and follow-ups.",
    },
    {
      title: "Learn what performs",
      body: "We track which creators, angles, and formats drive results, and use that to improve the next campaign.",
    },
  ],
};

export const FIT = {
  label: "Built for technical products",
  title: "The biggest creator is rarely the right creator.",
  points: [
    { title: "We understand the product", body: "We get into the product, use cases, and audience before shaping the campaign." },
    {
      title: "We know technical creators",
      body: "Our network and campaign experience are concentrated around AI, developer tools, and technical audiences across X, LinkedIn, YouTube, and newsletters.",
    },
    { title: "Fit over follower count", body: "The right 30K-person technical audience can matter more than a generic audience ten times larger." },
    { title: "One team, end to end", body: "Research, outreach, coordination, review, scheduling, and reporting are handled by one team." },
  ],
};

export const MEASURE = {
  label: "What we measure",
  title: "Impressions matter.",
  subtitle: "The right impressions matter more.",
  layers: [
    { name: "Distribution", items: ["Total reach", "Impressions by channel", "Creator coverage"] },
    { name: "Engagement", items: ["Replies", "Reposts", "Engagement quality", "Audience response"] },
    { name: "Business", items: ["Clicks", "Signups", "Demo requests", "Pipeline where measurable"] },
  ],
};

export const CTA = {
  title: "Put your product in front of the people your audience already listens to.",
  body: "We'll help you identify the right creators, campaign narrative, and distribution plan across the channels your audience follows.",
};
