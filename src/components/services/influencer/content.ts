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

// The hero's launch: webAI's TwIL-LM3-Pro launch post (by David Stout, 30 Sep 2026 18:40 UTC) and the 18 creator quote
// posts from Ritam's sheet, metrics captured 27 Oct 2026. `hour` is hours after the launch post, read from
// each post's X id. Creator views already include X pushing their posts beyond their own followers.
// `featured` posts show in full on the floor; the rest show as faces. Texts are verbatim from each post.
export type LaunchPost = { name: string; handle: string; url: string; platform: Platform; hour: number; text: string; views: number; featured?: boolean };

export const HERO_LAUNCH = {
  company: { name: "webAI", handle: "@thewebAI", logo: "/clients/webai.svg" },
  author: { name: "David Stout", photo: "/services/creators/webai/Davidstout.jpg" },
  url: "https://x.com/Davidstout/status/2105367134876365135",
  text: "We’re excited to introduce TwIL-LM3-Pro.\nAt just 3.6 billion parameters, it brings powerful reasoning to…",
  views: 596_400, // read off the post on 27 Oct 2026
  posts: [
    { name: "Ashutosh Shrivastava", handle: "ai_for_success", url: "https://x.com/ai_for_success/status/2105372789943537848", platform: "x", hour: 0.37, text: "webAI just dropped TwIL-LM3-Pro (3.6B).\nthis isn't built for general chatbot tasks, it is tuned specifically for multi-step logic problems.", views: 2_942 },
    { name: "Hasan Toor", handle: "hasantoxr", url: "https://x.com/hasantoxr/status/2105373534377959673", platform: "x", hour: 0.42, text: "China's small reasoning models have been embarrassing everyone on price and size.\nThis time one of them lost.\n@thewebai's TwIL-LM3-Pro (3.6B, built in Austin) leads VibeThinker-3B on all six formal-logic tasks in webAI's evals.", views: 12_169 },
    { name: "Santiago", handle: "svpino", url: "https://x.com/svpino/status/2105380308258521104", platform: "x", hour: 0.87, text: "This open-source model scores 95.4% on BIG-Bench Hard’s logic subset with just 3.66B parameters.\nTwIL-LM3-Pro is a model small enough to run locally on a laptop.\nSpecialized post-training is super cool.", views: 14_691, featured: true },
    { name: "Ben Geskin", handle: "BenGeskin", url: "https://x.com/BenGeskin/status/2105385471505256920", platform: "x", hour: 1.21, text: "A reasoning model that fits on your laptop can match one more than twice its size on formal logic.\n@thewebai’s new TwIL-LM3-Pro has 3.6B parameters.", views: 11_768 },
    { name: "marcus", handle: "marcusyul", url: "https://x.com/marcusyul/status/2105391082238628123", platform: "x", hour: 1.59, text: "AN AI THAT FITS ON YOUR LAPTOP JUST WENT UP AGAINST MODELS 33X ITS SIZE\nHere's how it did:\n→ Only 2 GB\n→ Works offline\n→ No usage fees\nOn math problems, it lands just 3 points behind a 120-billion-parameter model. It has 3.6 billion.", views: 45_221 },
    { name: "Rohan Paul", handle: "rohanpaul_ai", url: "https://x.com/rohanpaul_ai/status/2105407648338428049", platform: "x", hour: 2.68, text: "China's best small reasoning model (VibeThinker-3B) just got beaten by a 3.6B model from Austin.\n> webAI's TwIL-LM3-Pro, a 3.66B local model, lifts IBM Granite's formal-logic score by 28%", views: 6_400 },
    { name: "Charly Wargnier", handle: "DataChaz", url: "https://x.com/DataChaz/status/2105418739600806351", platform: "x", hour: 3.42, text: "THIS MODEL IS ONLY 2.09 GIB. LET THAT SINK IN\nWhat @thewebai managed to fit into just 3.6B parameters with TwIL-LM3-Pro is kinda ridiculous:\n→ beats VibeThinker-3B across all 6 formal-logic tasks tested", views: 22_546, featured: true },
    { name: "neural nets.", handle: "cneuralnetwork", url: "https://x.com/cneuralnetwork/status/2105421118249283728", platform: "x", hour: 3.58, text: "I read through the model card right now and tbh a 3.66B model beating VibeThinker-3B and GPT-OSS 120B across all six formal-logic tasks tested is pretty wild.\nWhat makes it interesting is the scale gap.", views: 2_395 },
    { name: "codila", handle: "0xCodila", url: "https://x.com/0xCodila/status/2105424681004097758", platform: "x", hour: 3.81, text: "Why did nobody listen Andrej Karpathy?\n\"The next big step in AI will come when a tiny model can pack an incredible amount of intelligence\"\nso @thewebai just dropped TwIL-LM3-Pro:", views: 5_280 },
    { name: "Atul Kumar", handle: "atulkumarzz", url: "https://x.com/atulkumarzz/status/2105451232408338900", platform: "x", hour: 5.57, text: "A 3.6B MODEL JUST PUNCHED WAY ABOVE ITS WEIGHT\nTwIL-LM3-Pro is tiny compared to today’s big reasoning models:\n→ 3.6B parameters\n→ 2.09 GiB in Q4\n→ Runs fully on your laptop\n→ No cloud required", views: 18_904 },
    { name: "ℏεsam", handle: "Hesamation", url: "https://x.com/Hesamation/status/2105456475594195418", platform: "x", hour: 5.92, text: "smaller models are getting insanely smart. this new 3.66B model comes close to the 120B gpt-oss on math word problems:\nin webAI’s GSM8K evaluation:\n> TwIL-LM3-Pro: 94.3%\n> gpt-oss-120b: 97.7%\n> x33 FEWER PARAMS", views: 8_728 },
    { name: "bodila", handle: "51bodila", url: "https://x.com/51bodila/status/2105460075166924916", platform: "x", hour: 6.16, text: "Andrej Karpathy predicted the future of AI once again:\n\"The next leap in AI could come from packing big-model intelligence: GPT & Claude - into tiny models\"\n- this is what caught my attention about thewebai’s TwIL-LM3-Pro", views: 2_919 },
    { name: "Haider.", handle: "haider1", url: "https://x.com/haider1/status/2105605031261282544", platform: "x", hour: 15.76, text: "last month, qwen 3.8 27b surprised me running locally on my RTX 3090\nnow webAI has released a 3.66B model with a quantized build of just 2GB hitting 95.4% on BBH logic\ni think we're going to see a lot more of this.", views: 6_342 },
    { name: "elvis", handle: "omarsar0", url: "https://x.com/omarsar0/status/2105730500811719056", platform: "x", hour: 24.06, text: "Small models are getting really good at reasoning.\nIt's exciting because SLMs can unlock so much at the harness layer.\nTwIL-LM3-Pro from @thewebAI has 3.6B parameters and runs locally on everyday computers.", views: 15_776, featured: true },
    { name: "me", handle: "twetsfyp", url: "https://x.com/twetsfyp/status/2105731675833745610", platform: "x", hour: 24.14, text: "These guys just released a 3.6B model that matches Qwen3-8B on formal logic with less than half the parameters.", views: 131_176 },
    { name: "Chubby", handle: "kimmonismus", url: "https://x.com/kimmonismus/status/2105911541384224800", platform: "x", hour: 36.05, text: "webAI has released a 3.66B model for formal logic that can run locally on a laptop.\nIn webAI’s tests, TwIL-LM3-Pro is roughly level with Qwen3-8B on the headline formal-logic composite, with less than half the parameters.", views: 14_176 },
    { name: "Movez", handle: "0xMovez", url: "https://x.com/0xMovez/status/2106026961134895407", platform: "x", hour: 43.7, text: "Small Language Models are the Future of Agentic AI\nMost agent calls are small decisions: route, classify, check, gate.\nnone of them need a frontier model.\nHere are my notes 👇\n→ An agent loop is mostly bounded choices, not deep reasoning", views: 3_618 },
    { name: "Codez", handle: "0xCodez", url: "https://x.com/0xCodez/status/2106036867426554100", platform: "x", hour: 44.35, text: "Andrej Karpathy predicted the future of AI once again:\n“Everyone’s renting frontier models for jobs a 3B model could do. Small models are the future.”\nthis 18-page PDF breaks down Karpathy’s case for working with small LLMs.", views: 158_045 },
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
    { name: "Distribution", stat: "1M+", unit: "reach", items: ["Total reach", "Impressions by channel", "Creator coverage"] },
    { name: "Engagement", stat: "5,000+", unit: "engagements", items: ["Replies", "Reposts", "Engagement quality", "Audience response"] },
    { name: "Business", stat: "1,000+", unit: "high-intent actions", items: ["Clicks", "Signups", "Demo requests", "Pipeline where measurable"] },
  ],
};

export const CTA = {
  title: "Put your product in front of the people your audience already listens to.",
  body: "We'll help you identify the right creators, campaign narrative, and distribution plan across the channels your audience follows.",
};
