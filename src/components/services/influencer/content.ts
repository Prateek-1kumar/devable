import type { Platform } from "../kit";

// Copy for the Influencer Marketing service page, from the copy doc.
//
// SAMPLE DATA: every creator (names, handles, photos, posts, view counts), the hero launch, and the case
// study results and quote are placeholders to judge the design. Replace them with real campaign posts,
// creator photos, and client-approved figures before this ships.

export const HERO = {
  label: "Influencer Marketing",
  title: "Distribution is the moat.",
  body: "We help AI-native devtools and platforms reach developers through the technical creators they already follow, from launches to ongoing campaigns.",
  stats: [
    { value: "50M+", label: "impressions" },
    { value: "500+", label: "creators" },
    { value: "30+", label: "campaigns" },
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

// The hero's launch, as it played out over its first 24 hours: webAI's own post, then the creators who
// picked it up (`hour` = hours after webAI posted). `total` is everyone the launch reached in 24h; what's
// left after webAI's and the creators' own views is the platforms pushing it further, so it all adds up.
// SAMPLE until Ritam's sheet lands: one row per creator post; paste the real values in here.
export type LaunchPost = { creator: number; platform: Platform; hour: number; text: string; views: number };

export const HERO_LAUNCH = {
  company: { name: "webAI", handle: "@thewebAI", logo: "/clients/webai.svg" },
  text: "webAI Navigator is live: frontier models, running privately on devices you own.",
  views: 120_000,
  total: 2_400_000,
  posts: [
    { creator: 1, platform: "x", hour: 1, text: "Ran a 70B model on my MacBook with webAI. No cloud, no API key.", views: 410_000 },
    { creator: 6, platform: "x", hour: 1, text: "webAI Navigator is out. Local models, zero setup.", views: 96_000 },
    { creator: 3, platform: "linkedin", hour: 2, text: "Private AI on the hardware your team already has.", views: 186_000 },
    { creator: 0, platform: "x", hour: 4, text: "On-device inference used to be a demo. webAI made it a product.", views: 320_000 },
    { creator: 4, platform: "x", hour: 5, text: "Benchmarked webAI against three cloud APIs. Thread ↓", views: 72_000 },
    { creator: 7, platform: "linkedin", hour: 7, text: "Every enterprise asking for private AI should look at what webAI shipped.", views: 144_000 },
    { creator: 5, platform: "linkedin", hour: 9, text: "What on-device AI means for regulated teams.", views: 58_000 },
  ] as LaunchPost[],
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
      body: "Concentrated attention around the moments that matter most, with creators amplifying the launch across X and LinkedIn.",
      fits: ["Product launches", "Major releases", "Funding announcements", "Open-source launches", "New feature announcements"],
    },
    {
      name: "Dedicated Creator Campaigns",
      body: "Built around your product, audience, and goals, with the right creator mix across the channels that matter.",
      fits: ["Product adoption", "Category awareness", "Product education", "Reaching new audiences", "Ongoing GTM"],
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
      body: "We evaluate creators based on technical credibility, audience fit, content quality, and past performance, not follower count.",
    },
    {
      title: "Build the right narrative",
      body: "The same product should not sound identical through every creator. We shape the angle and key messages around each creator while keeping the core narrative consistent.",
    },
    {
      title: "Run the campaign",
      body: "We handle outreach, negotiation, scheduling, approvals, and execution across the campaign. For launches, we sequence creators around key moments. For dedicated campaigns, we coordinate different creators, formats, and channels over time.",
    },
    {
      title: "Learn what performs",
      body: "We track which creators, angles, and formats perform best, and use those learnings to improve the next campaign.",
    },
  ],
  cta: "Plan a creator campaign",
};

export const COMMITMENTS = {
  label: "What we commit to",
  title: "Clear goals. Clear spend. Clear accountability.",
  items: [
    {
      tag: "Clear goals",
      title: "We agree on success before the campaign starts.",
      body: "Before anything goes live, we align on the objective and the metrics we\u2019ll use to measure success.",
    },
    {
      tag: "Clear spend",
      title: "You know exactly where the budget is going.",
      body: "You see the creator mix, budget allocation, and campaign plan before we start spending.",
    },
    {
      tag: "Clear accountability",
      title: "We measure success against the goal we agreed on.",
      body: "Every campaign is judged against the objective we set together. Posts, views, and engagement only matter if they move us toward that goal.",
    },
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
