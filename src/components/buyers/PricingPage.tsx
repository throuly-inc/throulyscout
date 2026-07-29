import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CreditCard, Zap, Shield } from "lucide-react";

interface PricingPageProps {
  onUpgrade: () => void;
  onKeepFree: () => void;
}

const features = [
  "See exactly which homes you qualify for",
  "Personalized DTI and affordability calculations",
  "Qualification reasons if you don't meet requirements",
  "Access to educational resources Connect with verified agents & loan officers loan officer directory",
  "Save unlimited property analyses",
  "Priority customer support",
];

export function PricingPage({ onUpgrade, onKeepFree }: PricingPageProps) {
  return (
    <div className="max-w-xl mx-auto">
      <Card className="p-8 md:p-10 text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
          <CreditCard className="w-10 h-10 text-accent" />
        </div>

        {/* Header */}
        <h1 className="font-serif text-2xl md:text-3xl text-foreground mb-3">
          Unlock Personalized Insights
        </h1>
        <p className="text-muted-foreground mb-8">
          Get customized qualification results based on YOUR financial profile
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 bg-accent/5 rounded-lg text-left"
            >
              <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
        </div>

        {/* Pricing Box */}
        <div className="bg-gradient-to-r from-accent to-primary rounded-xl p-6 mb-8 text-white">
          <p className="text-5xl font-bold mb-2">$79</p>
          <p className="text-white/80">One-time payment • Lifetime access</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Button
            variant="accent"
            size="lg"
            className="flex-1 h-12"
            onClick={onUpgrade}
          >
            <Zap className="w-5 h-5 mr-2" />
            Upgrade Now - $79
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-12"
            onClick={onKeepFree}
          >
            Keep Free Version
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span>Secure payment • 30-day money-back guarantee</span>
        </div>
      </Card>
    </div>
  );
}
