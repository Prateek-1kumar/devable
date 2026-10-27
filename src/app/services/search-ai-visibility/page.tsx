import type { Metadata } from "next";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";
import Cases from "@/components/services/search/Cases";
import { CTA, HERO } from "@/components/services/search/content";
import Expanded from "@/components/services/search/Expanded";
import Hero from "@/components/services/search/Hero";
import Measure from "@/components/services/search/Measure";
import Technical from "@/components/services/search/Technical";
import Workbench from "@/components/services/search/Workbench";

export const metadata: Metadata = {
  title: "Search & AI Visibility · Devable",
  description: HERO.body,
};

// Structured data for search engines and AI answers (escaped per the Next JSON-LD guide).
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Search & AI Visibility",
  serviceType: "SEO and AI search visibility",
  description: HERO.body,
  provider: { "@type": "Organization", name: "Devable" },
};

export default function SearchAiVisibility() {
  return (
    <main className="overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero />
      <Expanded />
      <Workbench />
      <Technical />
      <Measure />
      <Cases />
      <FinalCta title={CTA.title} subtitle="" body={CTA.body} ctaLabel={CTA.button} caseStudiesHref="#case-studies" caseStudiesLabel="See case studies" />
      <Footer />
    </main>
  );
}
