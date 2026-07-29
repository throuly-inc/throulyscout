import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, Crown, TrendingUp, BarChart3, Home, DollarSign, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PropertyAnalysisGateModalProps {
  open: boolean;
  onClose: () => void;
  onContinueFree: () => void;
}

export function PropertyAnalysisGateModal({ open, onClose, onContinueFree }: PropertyAnalysisGateModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7 text-accent" />
          </div>
          <DialogTitle className="font-serif text-2xl">AI Property Analysis is a Premium Feature</DialogTitle>
          <DialogDescription className="text-sm">
            Get instant AI-powered financial analysis of any property listing.
          </DialogDescription>
        </DialogHeader>

        {/* Mockup preview */}
        <Card className="p-4 bg-muted/50 border-border/50 space-y-3 blur-[2px] opacity-60 pointer-events-none select-none" aria-hidden>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-foreground">Estimated Rental Yield: 6.2%</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-foreground">Cap Rate: 5.8%</span>
          </div>
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-foreground">3 Comparable Sales Found</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-foreground">Cash-on-Cash Return: 8.4%</span>
          </div>
        </Card>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">What you'll unlock:</p>
          <ul className="space-y-1.5">
            {[
              "Estimated rental yield & cap rate",
              "Comparable sales analysis",
              "Neighborhood trends",
              "Investment recommendations",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-center gap-1 py-2">
          <Crown className="w-4 h-4 text-accent" />
          <span className="font-semibold text-accent">Unlock with Premium — $19/month</span>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="accent" className="w-full" onClick={() => navigate("/pricing")}>
            Upgrade Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={onContinueFree}>
            Continue with Market Analysis
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
