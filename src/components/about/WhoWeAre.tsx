// "Who we are", back on paper after the dark story band, in the hero's grammar at a step smaller: the label,
// a two-line claim, then the story as one paragraph stepped in under the claim's right side. The paragraph
// is two-tone like the hero headline: soft grey, its keywords in ink. The label and claim line up with the
// "How we operate" label below (that stage's left padding, inset 2.5vw).
const EDGE = "lg:ml-[calc(min(0px,(76rem-100cqw)/2)+2.5vw)]";

function Key({ children }: { children: string }) {
  return <span className="text-ink">{children}</span>;
}

export default function WhoWeAre() {
  return (
    <section aria-labelledby="who-we-are-title" className="@container px-6 py-28 sm:px-12 sm:py-36 xl:px-[6vw]">
      <div className="mx-auto grid max-w-[76rem] gap-y-8 lg:grid-cols-12 lg:gap-y-10">
        <p className={`self-start justify-self-start ${EDGE} rounded-[4px] bg-ink/[0.06] px-2.5 py-1 text-[0.8rem] tracking-[0.04em] text-ink/80 uppercase lg:col-span-12`}>
          Who we are
        </p>

        <h2
          id="who-we-are-title"
          className={`${EDGE} text-[clamp(2.2rem,4vw,3.75rem)] leading-[1.02] font-medium tracking-[-0.05em] text-ink lg:col-span-12`}
        >
          <span className="block">Builders first,</span>
          <span className="block">marketers second.</span>
        </h2>

        <p className="mt-4 max-w-[40rem] text-[clamp(1.5rem,2vw,1.75rem)] leading-[1.4] font-medium tracking-[-0.025em] text-ink/55 lg:col-span-7 lg:col-start-6 lg:mt-6">
          We were <Key>part of the audience</Key> before we ever marketed to them. Devable grew out of years spent{" "}
          <Key>building, writing, and creating</Key> for <Key>developers and AI engineers</Key>: technical writers,
          engineers, marketers, and creators who <Key>understand both the technology</Key> and how technical audiences
          discover, evaluate, and talk about products.
        </p>
      </div>
    </section>
  );
}
