import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, DollarSign, Wallet, PiggyBank } from "lucide-react";

const STORAGE_KEY = "throuly_financial_health_intro_seen";

const ITEMS = [
  {
    icon: CreditCard,
    title: "Credit score",
    desc: "Pull your real score from Credit Karma, Experian, or your bank/card app.",
  },
  {
    icon: DollarSign,
    title: "Income",
    desc: "Recent pay stub, W-2, or tax return.",
  },
  {
    icon: Wallet,
    title: "Debts",
    desc: "Current balances from loan or credit card statements.",
  },
  {
    icon: PiggyBank,
    title: "Savings / assets",
    desc: "Recent bank or savings account balance.",
  },
];

interface FinancialHealthIntroModalProps {
  /** When true, attempt to open the modal (only opens if not previously seen). */
  trigger: boolean;
}

export function FinancialHealthIntroModal({ trigger }: FinancialHealthIntroModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
      setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [trigger]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-screen max-sm:max-w-none max-sm:rounded-none max-sm:border-0 max-sm:top-0 max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:p-0 max-h-[90vh] flex flex-col gap-0">
        <div className="flex-1 overflow-y-auto max-sm:px-5 max-sm:pt-5 max-sm:pb-4">
          <DialogHeader className="text-left">
            <DialogTitle className="font-serif text-xl sm:text-2xl">Get the most accurate results</DialogTitle>
            <DialogDescription className="text-sm">
              To ensure the best results, make sure you confirm your information. For example, for your
              credit score, check Credit Karma or a similar credit score checker rather than guessing.
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-2.5 pt-4">
            {ITEMS.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-accent/10">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
                  <p className="text-sm text-muted-foreground leading-snug">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="max-sm:px-5 max-sm:py-4 max-sm:border-t max-sm:border-border max-sm:bg-background max-sm:mt-0">
          <Button variant="accent" className="w-full" onClick={() => handleOpenChange(false)}>
            Got it, let's start
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
