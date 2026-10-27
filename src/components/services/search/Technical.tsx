import { Label } from "../kit";
import { TECHNICAL } from "./content";

// Why a technical team runs this: three statements in the homepage Channel Problems grid (hairline cells on
// near-black), so the page changes register between the work above and the numbers below. Text only; the
// claim is the content.
export default function Technical() {
  return (
    <section aria-labelledby="technical-title" className="bg-[#0b0b0b] px-6 py-20 sm:px-12 lg:py-24 xl:px-[6vw]">
      <div className="mx-auto max-w-[76rem]">
        <Label dark>{TECHNICAL.label}</Label>
        <h2 id="technical-title" className="mt-6 max-w-[22ch] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-white">
          {TECHNICAL.title}
        </h2>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 md:grid-cols-3">
          {TECHNICAL.points.map((p, i) => (
            <li key={p.title} className="flex flex-col bg-black p-6 lg:p-8">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1 font-mono text-[11px] font-medium tracking-[0.08em] text-white/70">
                <span className="size-1.5 rounded-full bg-light-green" />
                0{i + 1}
              </span>
              <h3 className="mt-8 text-[1.05rem] font-medium tracking-[-0.015em] text-white lg:mt-12">{p.title}</h3>
              <p className="mt-2 text-[0.875rem] leading-[1.55] text-white/55">{p.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
