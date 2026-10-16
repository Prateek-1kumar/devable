// "Who we are", back on paper after the dark story band: a small label on the left, the claim and the
// story stepped in on the right, on the same grid as AboutHero. The label lines up with the "How we work"
// label below it (that stage's left padding, inset 2.5vw).
export default function WhoWeAre() {
  return (
    <section aria-labelledby="who-we-are-title" className="@container px-6 py-28 sm:px-12 sm:py-36 xl:px-[6vw]">
      <div className="mx-auto grid max-w-[76rem] gap-10 lg:grid-cols-12">
        <p className="self-start justify-self-start lg:ml-[calc(min(0px,(76rem-100cqw)/2)+2.5vw)] rounded-[4px] bg-ink/[0.06] px-2.5 py-1 text-[0.8rem] tracking-[0.04em] text-ink/80 uppercase lg:col-span-5">
          Who we are
        </p>

        <div className="max-w-[38rem] lg:col-span-7">
          <h2
            id="who-we-are-title"
            className="text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.045em] text-ink"
          >
            Built from inside the developer ecosystem.
          </h2>
          <div className="mt-10 space-y-6 text-lg leading-relaxed tracking-[-0.01em] text-ink/75 sm:text-xl">
            <p>We were part of the audience before we started marketing to it.</p>
            <p>Devable grew out of years spent building, writing, and creating for developers and AI engineers.</p>
            <p>
              Our team brings together technical writers, engineers, marketers, and creators who understand both the
              technology and how technical audiences discover, evaluate, and talk about products.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
