import { useState, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { AddressChat } from "@/components/analyzer/AddressChat";
import { PropertyAnalysisGateModal } from "@/components/premium/PropertyAnalysisGateModal";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SEO } from "@/components/seo/SEO";
import { Link } from "react-router-dom";
import { clearActiveBuyerSession } from "@/lib/buyerSessionStorage";

const PROPERTY_URL_PATTERNS = [
  /zillow\.com/i,
  /realtor\.com/i,
  /redfin\.com/i,
  /trulia\.com/i,
];

function isPropertyUrl(input: string): boolean {
  return PROPERTY_URL_PATTERNS.some((pattern) => pattern.test(input));
}

export default function Analyzer() {
  const { canAccess } = useSubscription();
  const isPremium = canAccess("property_analysis");
  const [gateOpen, setGateOpen] = useState(false);

  const handleBeforeSubmit = useCallback((query: string): boolean => {
    if (isPropertyUrl(query) && !isPremium) {
      setGateOpen(true);
      return false; // block submission
    }
    return true; // allow submission
  }, [isPremium]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Market Analyzer | Home Affordability Calculator — Throuly"
        description="Analyze any US address alongside Throuly's home affordability calculator — instant AI insights on property values, neighborhood trends, and what you can actually afford."
        path="/analyzer"
      />
      <Navbar />
      <main className="flex-1 flex flex-col pt-16">
        <h1 className="sr-only">Real Estate Market Analyzer</h1>
        <p className="text-center text-sm text-muted-foreground px-4 pt-4">
          Pair any address with our <Link to="/buyers" onClick={clearActiveBuyerSession} className="underline underline-offset-2 hover:text-foreground">home affordability calculator</Link> to see what you can actually buy.
        </p>
        <AddressChat onBeforeSubmit={handleBeforeSubmit} />
      </main>
      <PropertyAnalysisGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        onContinueFree={() => setGateOpen(false)}
      />
    </div>
  );
}
