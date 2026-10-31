import type { Metadata } from "next";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";
import { FeaturedGuide, GuideGrid, GuidesHeader } from "@/components/resources/Guides";
import { getGuides, spotlight } from "@/lib/resources";

export const metadata: Metadata = {
  title: "Guides & Playbooks · Devable",
  description: "Step-by-step guides and playbooks for reaching developers and technical buyers.",
};

export default async function Guides() {
  const guides = await getGuides();
  const [[featured], rest] = spotlight(guides, 1);

  return (
    <main className="overflow-x-clip">
      <GuidesHeader count={guides.length} />
      {featured && <FeaturedGuide guide={featured} />}
      <GuideGrid guides={rest} />
      <FinalCta caseStudiesHref="/#case-studies" />
      <Footer />
    </main>
  );
}
