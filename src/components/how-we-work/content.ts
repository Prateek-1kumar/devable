// The section's words, verbatim from the brief and in reading order: the single source for the DOM column,
// the rail and the still layout. Every include has a square in its step's colour, and the scene plays
// include k of the active step on beat k. No imports, so the server-rendered copy never pulls in the scene.
// The DOM composes each step's h3 as `NN — Title` (U+2014) and each rail button as `NN Title`.

export const EYEBROWS = ["How we work", "Our approach"] as const; // title case; CSS renders them uppercase
export const TITLE = "A growth engine built around your product.";
export const INTRO =
  "From product understanding and growth strategy through to execution and optimization, we run a connected growth engine across content, organic search, AI visibility, Reddit, developer communities, and creator distribution. The goal: build visibility that compounds into pipeline.";
/** The close's goal line: the intro's last sentence again (aria-hidden in the DOM). */
export const GOAL = "The goal: build visibility that compounds into pipeline.";
export const INCLUDES_LABEL = "Includes:";
export const RAIL_LABEL = "How we work steps"; // the rail <nav>'s aria-label

/** The close pose, for the still layout's overview image. */
export const STILL_OVERVIEW = "/how-we-work/still-overview.jpg";

// Checklist square colours: amber is the light; forest, indigo, azure, emerald and sun are the channels (04 follows
// the lantern's sector panes); energy and lime are the harbour's growth.
const AMBER = "#fcb401", FOREST = "#0c3b29", INDIGO = "#4f46e5", AZURE = "#0ea5e9", EMERALD = "#10b981", SUN = "#f5b301";
const ENERGY = "#34d399", LIME = "#c6ef5c";

export const STEPS = [
  {
    n: "01",
    title: "Product Intelligence",
    headline: "Understand the product before building the growth engine.",
    body: "Most marketing teams start with channels. We start by understanding what you built, who it is for, how the market sees it, and where the opportunities exist.",
    includes: [
      "Product and technical deep dive",
      "Audience and buyer research",
      "Competitive analysis",
      "Positioning analysis",
      "Existing content and visibility review",
    ],
    squares: [AMBER, AMBER, AMBER, AMBER, AMBER],
    still: "/how-we-work/still-01.jpg",
  },
  {
    n: "02",
    title: "Growth Strategy",
    headline: "Find the opportunities that matter.",
    body: "We turn product intelligence into a clear growth direction by identifying the channels, narratives, and opportunities that align with your audience, market, and goals.",
    includes: ["Channel prioritization", "Content roadmap", "Search and AI visibility opportunities", "Community strategy", "Creator strategy"],
    squares: [FOREST, INDIGO, AZURE, EMERALD, SUN],
    still: "/how-we-work/still-02.jpg",
  },
  {
    n: "03",
    title: "Content Engine",
    headline: "Build content developers trust.",
    body: "Technical audiences do not respond to generic marketing content. We combine technical expertise, research, and growth strategy to create content that educates developers and improves search and AI visibility.",
    includes: [
      "Technical articles and tutorials",
      "Product-led content",
      "Comparison pages and guides",
      "Code examples and demos",
      "Content optimization and updates",
    ],
    squares: [INDIGO, INDIGO, INDIGO, INDIGO, INDIGO],
    still: "/how-we-work/still-03.jpg",
  },
  {
    n: "04",
    title: "Distribution Engine",
    headline: "Make your content discoverable across the channels that matter.",
    body: "We connect content with the channels that influence product discovery, from organic search and AI visibility to developer communities and trusted creators.",
    includes: [
      "Organic search optimization",
      "AI visibility strategy",
      "Reddit and community distribution",
      "Creator campaigns",
      "Social distribution",
    ],
    squares: [AZURE, AZURE, EMERALD, SUN, INDIGO],
    still: "/how-we-work/still-04.jpg",
  },
  {
    n: "05",
    title: "Optimization Loop",
    headline: "Learn, improve, and compound over time.",
    body: "Growth is not a one-time campaign. We continuously analyze performance, audience feedback, and market changes to improve what we create and how we distribute it.",
    includes: ["Performance analysis", "Content updates", "Campaign optimization", "Strategy refinement", "New growth opportunities"],
    squares: [ENERGY, ENERGY, ENERGY, ENERGY, LIME],
    still: "/how-we-work/still-05.jpg",
  },
] as const;
