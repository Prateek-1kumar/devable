import type { Metadata } from "next";
import Footer from "@/components/Footer";
import { CareersHero, HowWeWork, NoRole, OpenRoles, StandFor, TrustedStrip, WhyDevable } from "@/components/careers/Careers";

export const metadata: Metadata = {
  title: "Careers · Devable",
  description: "Join a small, ambitious team working closely with AI-native companies and developer tools.",
};

export default function Careers() {
  return (
    <main className="overflow-x-clip">
      <CareersHero />
      <TrustedStrip />
      <WhyDevable />
      <StandFor />
      <HowWeWork />
      <OpenRoles />
      <NoRole />
      <Footer />
    </main>
  );
}
