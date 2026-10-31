// The Resources content model for Sanity Studio: drop `schemaTypes` into the studio's `schema.types`.
// Kept dependency-free (plain objects, which is all `defineType` returns) so the site builds before the
// studio exists. Field names match the GROQ projections in src/lib/resources.ts; rename both together.

type Rule = { required(): Rule; max(n: number): Rule; min(n: number): Rule; warning(message?: string): Rule };

const slug = { name: "slug", type: "slug", options: { source: "title", maxLength: 96 }, validation: (r: Rule) => r.required() };

const cover = {
  name: "coverImage",
  title: "Thumbnail",
  type: "image",
  description: "Optional. Without one, the site draws a cover in the topic's tone.",
  options: { hotspot: true },
  fields: [{ name: "alt", title: "Alt text", type: "string", validation: (r: Rule) => r.required() }],
};

// Fields every post and guide share: what the cards, filters and featured slots read.
const resourceFields = [
  { name: "title", type: "string", validation: (r: Rule) => r.required().max(120) },
  slug,
  {
    name: "excerpt",
    title: "Description",
    type: "text",
    rows: 3,
    description: "One or two sentences for cards and the nav.",
    validation: (r: Rule) => r.required().max(220),
  },
  cover,
  { name: "topic", title: "Category", type: "reference", to: [{ type: "topic" }], validation: (r: Rule) => r.required() },
  { name: "author", type: "reference", to: [{ type: "author" }], validation: (r: Rule) => r.required() },
  { name: "publishedAt", title: "Date", type: "datetime", validation: (r: Rule) => r.required() },
  { name: "readMinutes", title: "Read time (minutes)", type: "number", validation: (r: Rule) => r.min(1) },
  { name: "body", type: "array", of: [{ type: "block" }, { type: "image", options: { hotspot: true } }] },
];

export const topic = {
  name: "topic",
  title: "Category",
  type: "document",
  fields: [
    { name: "title", type: "string", validation: (r: Rule) => r.required() },
    slug,
    {
      name: "tone",
      type: "string",
      description: "Colours the topic's chip and its drawn covers.",
      options: {
        list: [
          { title: "Green (search)", value: "green" },
          { title: "Orange (creators)", value: "orange" },
          { title: "Sage (community)", value: "sage" },
          { title: "Ink (technical)", value: "ink" },
        ],
        layout: "radio",
      },
      initialValue: "green",
      validation: (r: Rule) => r.required(),
    },
    { name: "order", type: "number", description: "Position in the blog's topic filters." },
  ],
  orderings: [{ title: "Filter order", name: "order", by: [{ field: "order", direction: "asc" }] }],
};

export const author = {
  name: "author",
  type: "document",
  fields: [
    { name: "name", type: "string", validation: (r: Rule) => r.required() },
    { name: "role", type: "string" },
    { name: "image", type: "image", options: { hotspot: true } },
  ],
};

export const post = {
  name: "post",
  title: "Blog post",
  type: "document",
  fields: [
    ...resourceFields,
    {
      name: "featured",
      type: "boolean",
      description: "Pin to the top of the blog. The newest three featured posts fill the top section.",
      initialValue: false,
    },
  ],
  orderings: [{ title: "Newest", name: "newest", by: [{ field: "publishedAt", direction: "desc" }] }],
  preview: { select: { title: "title", subtitle: "topic.title", media: "coverImage" } },
};

export const guide = {
  name: "guide",
  title: "Guide or playbook",
  type: "document",
  fields: [
    { name: "format", type: "string", options: { list: ["Guide", "Playbook"], layout: "radio" }, initialValue: "Guide", validation: (r: Rule) => r.required() },
    ...resourceFields,
    { name: "chapters", type: "number", description: "Shown on the card, e.g. “6 chapters”." },
    { name: "featured", type: "boolean", description: "Lead the Guides & Playbooks page. The newest featured guide wins.", initialValue: false },
  ],
  orderings: [{ title: "Newest", name: "newest", by: [{ field: "publishedAt", direction: "desc" }] }],
  preview: { select: { title: "title", subtitle: "format", media: "coverImage" } },
};

/** Singleton: open it once in the studio (fixed document id "resourcesSettings"). */
export const resourcesSettings = {
  name: "resourcesSettings",
  title: "Resources settings",
  type: "document",
  fields: [
    {
      name: "navFeature",
      title: "Featured in the Resources menu",
      type: "reference",
      to: [{ type: "guide" }, { type: "post" }],
      description: "The guide or article to push in the nav dropdown. Empty: the featured guide.",
    },
  ],
};

export const schemaTypes = [topic, author, post, guide, resourcesSettings];
