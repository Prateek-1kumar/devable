import { Mark, type Icon } from "../parts";

// The six places buyers look, beneath the hero: Google, ChatGPT, Perplexity, Claude, Gemini and Reddit, each a
// tile with its real mark and its name, under a label with a hairline either side. The tiles have no outline: an
// edge of light, a soft layered shadow and a lighter top, the way a card sits on paper. Not static: on a long loop
// each tile is lit in turn (a small lift, a green glow, a thin green line along its top, its mark turning a few
// degrees) so the row sweeps from left to right, and hovering a tile does the same with a springy ease.
const SURFACES: { name: string; mark: Icon }[] = [
  { name: "Google", mark: "google" },
  { name: "ChatGPT", mark: "chatgpt" },
  { name: "Perplexity", mark: "perplexity" },
  { name: "Claude", mark: "claude" },
  { name: "Gemini", mark: "gemini" },
  { name: "Reddit", mark: "reddit" },
];
const SPRING = "ease-[cubic-bezier(0.34,1.56,0.64,1)]";

export default function HeroSurfaces() {
  return (
    <div className="mx-auto mt-16 max-w-[64rem] sm:mt-20">
      <p className="flex items-center gap-5 font-mono text-[0.72rem] tracking-[0.16em] text-ink/55 uppercase sm:gap-7 sm:text-[0.78rem]">
        <span aria-hidden="true" className="h-px flex-1 bg-ink/12" />
        <span className="text-center">Visible across the surfaces your buyers use</span>
        <span aria-hidden="true" className="h-px flex-1 bg-ink/12" />
      </p>
      <ul className="mt-7 grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-6">
        {SURFACES.map((s, i) => {
          const at = `${1.6 + i * 0.32}s`;
          return (
            <li key={s.name} className="motion-safe:animate-fade-up" style={{ animationDelay: `${0.35 + i * 0.07}s` }}>
              <div
                className={`group relative flex h-full flex-col items-center gap-3.5 rounded-[22px] bg-[linear-gradient(180deg,#ffffff_0%,#fbfaf6_100%)] px-2 pt-7 pb-6 shadow-[0_0_0_1px_rgb(23_44_33/0.07),0_1px_2px_rgb(23_44_33/0.05),0_14px_28px_-18px_rgb(23_44_33/0.25),inset_0_1px_0_#fff] transition-[transform,box-shadow] duration-500 ${SPRING} motion-safe:animate-tile-scan hover:animate-none hover:-translate-y-1.5 hover:shadow-[0_0_0_1px_rgb(25_231_110/0.4),0_1px_2px_rgb(23_44_33/0.05),0_22px_32px_-16px_rgb(25_231_110/0.5),inset_0_1px_0_#fff] motion-reduce:transition-none`}
                style={{ animationDelay: at }}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 motion-safe:animate-tile-line group-hover:animate-none group-hover:opacity-100"
                  style={{ animationDelay: at }}
                />
                <span className={`motion-safe:animate-logo-scan transition-transform duration-500 ${SPRING} group-hover:scale-[1.14] group-hover:-rotate-6 group-hover:animate-none`} style={{ animationDelay: at }}>
                  <Mark name={s.mark} className="size-10 sm:size-11" />
                </span>
                <span className="text-[0.92rem] font-medium tracking-[-0.01em] text-ink">{s.name}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
