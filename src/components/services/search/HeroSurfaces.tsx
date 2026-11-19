import { Mark, type Icon } from "../parts";

// The places buyers look, beneath the hero: Google, the AI assistants (ChatGPT, Perplexity, Claude, Gemini, Grok,
// Copilot), G2 and Reddit, each a calm paper tile with its real mark and its name, under a label with a hairline either side. Nothing glows. The tiles
// have a fine edge of light and a soft shadow, rise in once in turn, and react only to the pointer: a small lift and
// the mark growing a touch.
const SURFACES: { name: string; mark: Icon }[] = [
  { name: "Google", mark: "google" },
  { name: "ChatGPT", mark: "chatgpt" },
  { name: "Perplexity", mark: "perplexity" },
  { name: "Claude", mark: "claude" },
  { name: "Gemini", mark: "gemini" },
  { name: "Grok", mark: "grok" },
  { name: "Copilot", mark: "copilot" },
  { name: "G2", mark: "g2" },
  { name: "Reddit", mark: "reddit" },
];

export default function HeroSurfaces() {
  return (
    <div className="mx-auto mt-16 max-w-[64rem] sm:mt-20 lg:max-w-[72rem]">
      <p className="flex items-center gap-5 font-mono text-[0.72rem] tracking-[0.16em] text-ink/55 uppercase sm:gap-7 sm:text-[0.78rem]">
        <span aria-hidden="true" className="h-px flex-1 bg-ink/[0.1]" />
        <span className="text-center">Visible across the surfaces your buyers use</span>
        <span aria-hidden="true" className="h-px flex-1 bg-ink/[0.1]" />
      </p>
      <ul className="mx-auto mt-7 grid max-w-[30rem] grid-cols-3 gap-3 sm:gap-4 lg:max-w-none lg:grid-cols-9">
        {SURFACES.map((s, i) => (
          <li key={s.name} className="motion-safe:animate-fade-up" style={{ animationDelay: `${0.35 + i * 0.07}s` }}>
            <div className="group flex h-full flex-col items-center gap-3.5 rounded-[20px] bg-[#faf9f5] px-2 pt-6 pb-5 shadow-[0_0_0_1px_rgb(23_44_33/0.05),0_10px_20px_-18px_rgb(23_44_33/0.22)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgb(23_44_33/0.07),0_18px_28px_-20px_rgb(23_44_33/0.3)] motion-reduce:transition-none">
              <span className="transition-transform duration-300 ease-out group-hover:scale-[1.07]">
                <Mark name={s.mark} className="size-9 sm:size-10" />
              </span>
              <span className="text-[0.88rem] font-medium tracking-[-0.01em] whitespace-nowrap text-ink">{s.name}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
