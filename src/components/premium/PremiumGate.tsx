import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown, ArrowRight } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface PremiumGateProps {
  featureName: string;
  featureDescription: string;
  children: ReactNode;
  /** Override the canAccess check — if true, gate is shown */
  gated?: boolean;
}

export function PremiumGate({ featureName, featureDescription, children, gated }: PremiumGateProps) {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();

  const shouldGate = gated !== undefined ? gated : !isPremium;

  if (!shouldGate) {
    return <>{children}</>;
  }

  return (
    <Card className="relative overflow-hidden border-accent/20">
      {/* Blurred children preview */}
      <div className="pointer-events-none select-none blur-sm opacity-40 max-h-64 overflow-hidden" aria-hidden>
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-[2px]">
        <div className="text-center max-w-sm px-6">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-accent" />
          </div>
          <h3 className="font-serif text-xl text-foreground mb-2">{featureName}</h3>
          <p className="text-sm text-muted-foreground mb-4">{featureDescription}</p>
          <div className="flex items-center justify-center gap-1 mb-4">
            <Crown className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-accent">$19/month</span>
          </div>
          <Button variant="accent" onClick={() => navigate("/pricing")} className="w-full">
            Upgrade
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
