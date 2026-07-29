import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Crown, ArrowRight } from "lucide-react";

interface CalculationLimitBannerProps {
  used: number;
  max: number;
}

export function CalculationLimitBanner({ used, max }: CalculationLimitBannerProps) {
  const navigate = useNavigate();

  if (used < max) return null;

  return (
    <Card className="p-5 border-accent/30 bg-accent/5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
          <Calculator className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground text-sm mb-1">
            You've used {used} of {max} free calculations
          </p>
          <p className="text-xs text-muted-foreground">
            Upgrade for unlimited affordability calculations and full property details.
          </p>
        </div>
        <Button variant="accent" size="sm" onClick={() => navigate("/pricing")}>
          <Crown className="w-4 h-4 mr-1" />
          Upgrade
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}
