import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home, ArrowRight } from "lucide-react";
import { clearActiveBuyerSession } from "@/lib/buyerSessionStorage";

interface SignUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignUpModal({ open, onOpenChange }: SignUpModalProps) {
  const navigate = useNavigate();

  const handleContinue = () => {
    onOpenChange(false);
    clearActiveBuyerSession();
    navigate("/buyers");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-center">Welcome to throuly</DialogTitle>
          <p className="text-muted-foreground text-center text-sm mt-2">
            Let's help you understand what you can afford.
          </p>
        </DialogHeader>

        <div className="py-6">
          <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-accent bg-accent/5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-accent/20">
              <Home className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Ready to buy?</p>
              <p className="text-sm text-muted-foreground">
                Get personalized affordability estimates for all 50 states.
              </p>
            </div>
          </div>
        </div>

        <Button variant="hero" size="lg" className="w-full" onClick={handleContinue}>
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}

