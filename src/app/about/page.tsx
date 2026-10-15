import type { Metadata } from "next";
import AboutHero from "@/components/about/AboutHero";
import GlassStory from "@/components/about/GlassStory";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About · Devable",
  description:
    "Engineers, technical writers, creators, and growth operators helping AI-native and technical companies reach the people who matter.",
};

export default function About() {
  return (
    <main className="overflow-x-clip">
      <AboutHero />
      <GlassStory />
      <Footer />
    </main>
  );
}
