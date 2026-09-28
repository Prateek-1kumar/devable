import EmbeddedExecution from "@/components/EmbeddedExecution";
import LandedPill from "@/components/LandedPill";
import RaceHero from "@/components/race/RaceHero";
import Stats from "@/components/Stats";
import TrustedBy from "@/components/TrustedBy";

export default function Home() {
  return (
    <main>
      <RaceHero />
      <LandedPill landed={<TrustedBy />} below={<Stats />} />
      <EmbeddedExecution />
    </main>
  );
}
