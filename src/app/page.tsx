import EmbeddedExecution from "@/components/EmbeddedExecution";
import LandedPill from "@/components/LandedPill";
import MissionHero from "@/components/mission/MissionHero";
import Stats from "@/components/Stats";
import TrustedBy from "@/components/TrustedBy";

export default function Home() {
  return (
    <main>
      <MissionHero />
      <LandedPill below={<Stats />}>
        <TrustedBy />
      </LandedPill>
      <EmbeddedExecution />
    </main>
  );
}
