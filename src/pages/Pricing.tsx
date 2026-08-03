import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PricingPage } from "@/components/buyers/PricingPage";
import { SEO } from "@/components/seo/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { STRIPE_PRICES } from "@/lib/stripe-prices";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      navigate("/auth?returnTo=%2Fpricing");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("throulyscout-create-checkout", {
        body: { priceId: STRIPE_PRICES.buyer_premium },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch {
      toast({
        title: "Checkout failed",
        description: "We couldn't start checkout. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Pricing — Throuly Scout"
        description="Unlock personalized qualification results, unlimited saved analyses, and priority support with Throuly Scout Premium."
        path="/pricing"
      />
      <Navbar />
      <main className="pt-32 pb-24 px-4">
        {isPremium ? (
          <div className="max-w-xl mx-auto text-center bg-card border border-border rounded-2xl p-10">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success" />
            <h1 className="font-serif text-2xl text-foreground mb-3">You're already Premium</h1>
            <p className="text-muted-foreground mb-6">
              Your account has full access to all premium features.
            </p>
            <Button variant="hero" size="lg" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        ) : (
          <div aria-busy={loading}>
            <PricingPage onUpgrade={handleUpgrade} onKeepFree={() => navigate("/buyers")} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
