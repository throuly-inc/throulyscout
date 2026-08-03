import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductHero } from "@/components/product/ProductHero";
import { ProductFeatureCards } from "@/components/product/ProductFeatureCards";
import { ProductCTABand } from "@/components/product/ProductCTABand";
import { ProductTestimonial } from "@/components/product/ProductTestimonial";
import { ScoutMockup } from "@/components/product/ScoutMockup";
import { SEO } from "@/components/seo/SEO";

const scoutFeatures = [
  "Search and qualify across all 50 states anonymously",
  "See real mortgage rates based on your financial profile",
  "Compare rental yields and market trends by market",
  "Save your results — no account required to start",
];

const featureCards = [
  {
    icon: "🗺️",
    title: "All 50 States",
    body: "Compare buying power and mortgage rates across every state simultaneously. See where your budget goes furthest.",
  },
  {
    icon: "📈",
    title: "Investor Intelligence",
    body: "Analyze rental yields, market trends, and cap rates by market. Built for investors making data-driven decisions.",
  },
  {
    icon: "🔒",
    title: "Fully Private",
    body: "Explore, calculate, and compare without giving up your contact information. Your details stay yours.",
  },
];

const Scout = () => {
  const mockContent = <ScoutMockup />;

  return (
    <div className="min-h-screen" style={{ background: '#f7f4ee' }}>
      <SEO
        title="Scout — Private Home Affordability Calculator | Throuly"
        description="Throuly Scout is a private home affordability calculator: search, qualify, and compare properties across all 50 states with real mortgage rates — no contact details shared."
        path="/scout"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Throuly Scout",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          description: "A private, 50-state home affordability calculator and property search for buyers.",
          url: "https://throulyscout.com/scout",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <Navbar />


      <ProductHero
        bgColor="#0a1a22"
        glowColor="rgba(2,132,199,0.3)"
        eyebrow="THROULY SCOUT"
        eyebrowColor="#7dd3fc"
        eyebrowBg="rgba(2,132,199,0.12)"
        eyebrowBorder="rgba(125,211,252,0.25)"
        headline={
          <>
            Know your number before anyone knows your{" "}
            <span className="italic" style={{ color: '#7dd3fc' }}>name.</span>
          </>
        }
        body="Throuly Scout is a private home affordability calculator and property search. Enter your income, savings, and target states — Scout tells you exactly what you can afford and what rates you qualify for across all 50 states, without sharing a single contact detail."
        features={scoutFeatures}
        primaryLabel="Start for free"
        primaryBg="#7dd3fc"
        primaryColor="#07091a"
        primaryHref="/buyers"
        ghostLabel="Watch demo"
        trustNote="🔒 No account needed. Your data is never sold."
        mockContent={mockContent}
      />

      <ProductFeatureCards
        eyebrow="Why Scout"
        headline="Search without the spam."
        cards={featureCards}
      />

      <ProductTestimonial
        quote="Scout showed me I could afford 40% more house in Ohio than in California. We moved in 3 months and our mortgage is $800 less per month. I never would have known without Throuly."
        author="Marcus Chen"
        role="Relocating Homebuyer"
        location="Columbus, OH"
        productColor="#0284c7"
      />

      <ProductCTABand
        headline="Ready to see your number?"
        sub="No account. No spam. No strings. Start in 60 seconds."
        buttonLabel="Get Early Access →"
        glowColor="rgba(2,132,199,0.3)"
      />

      <Footer />
    </div>
  );
};

export default Scout;
