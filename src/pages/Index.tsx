import { useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { PillarsSection } from "@/components/home/PillarsSection";
import { ScoutSpotlightSection } from "@/components/home/ScoutSpotlightSection";
import { TrustedBySection } from "@/components/home/TrustedBySection";

import { ValuePropsSection } from "@/components/home/ValuePropsSection";
import { StatsSection } from "@/components/home/StatsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { SocialProofSection } from "@/components/home/SocialProofSection";
import { CTASection } from "@/components/home/CTASection";
import { SEO } from "@/components/seo/SEO";

const Index = () => {
  const howItWorksRef = useRef<HTMLElement>(null);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Throuly Scout — Private Home Affordability for Buyers, All 50 States"
        description="Throuly Scout is a buyer-only home affordability platform. Privately calculate what you qualify for across all 50 states — no spam calls, no data brokers."
        path="/"
      />
      <Navbar />
      <main>
        <HeroSection onLearnMore={scrollToHowItWorks} />
        <PillarsSection />
        <TrustedBySection />
        <ScoutSpotlightSection />
        <HowItWorksSection ref={howItWorksRef} />
        <StatsSection />
        <TestimonialsSection />
        <SocialProofSection />
        <ValuePropsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
