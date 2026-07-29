import { StateData } from "@/lib/states";
import { FinancialProfile, LOAN_TYPES, calculateMortgage, formatCurrency } from "@/lib/calculator";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type LoanEligibilityCheckerProps = {
  state: StateData;
  homePrice: number;
  downPaymentPercent: number;
  hoaMonthly: number;
  financialProfile: FinancialProfile;
};

type EligibilityStatus = "eligible" | "verify" | "not_eligible";

function getEligibilityStatus(loanTypeId: string, qualifies: boolean): EligibilityStatus {
  const requiresVerification = loanTypeId === "va" || loanTypeId === "usda";
  if (!qualifies) return "not_eligible";
  return requiresVerification ? "verify" : "eligible";
}

export function LoanEligibilityChecker({
  state,
  homePrice,
  downPaymentPercent,
  hoaMonthly,
  financialProfile,
}: LoanEligibilityCheckerProps) {
  return (
    <Card className="p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-5 h-5 text-accent" />
        <h3 className="font-medium text-foreground">Loan Eligibility Checker</h3>
        <Tooltip>
          <TooltipTrigger>
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>
              Based on your credit score, down payment, savings, and estimated DTI for this home.
              Some programs (VA/USDA) require extra eligibility checks.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {LOAN_TYPES.map((lt) => {
          const calc = calculateMortgage(homePrice, downPaymentPercent, state, financialProfile, hoaMonthly, lt.id);
          const status = getEligibilityStatus(lt.id, calc.qualifies);

          const reasons: string[] = [];
          if (downPaymentPercent < lt.minDownPayment) reasons.push(`Min down: ${lt.minDownPayment}%`);
          if (financialProfile.creditScore < lt.minCreditScore) reasons.push(`Min credit: ${lt.minCreditScore}+`);
          if (financialProfile.savings < calc.totalCashNeeded) reasons.push(`Cash needed: ${formatCurrency(calc.totalCashNeeded)}`);
          if (calc.backEndDTI > lt.maxDTI) reasons.push(`DTI too high: ${calc.backEndDTI}% (max ${lt.maxDTI}%)`);
          if (lt.id === "va") reasons.push("Must be eligible veteran/service member");
          if (lt.id === "usda") reasons.push("Must meet location + income requirements");

          const badgeClassName = cn(
            "text-xs",
            status === "eligible" && "bg-success text-success-foreground",
            status === "verify" && "bg-warning text-warning-foreground",
            status === "not_eligible" && "bg-destructive text-destructive-foreground"
          );

          const badgeLabel =
            status === "eligible" ? "Likely eligible" : status === "verify" ? "Verify eligibility" : "Not eligible";

          const Icon = status === "eligible" ? CheckCircle2 : status === "verify" ? HelpCircle : XCircle;

          return (
            <Tooltip key={lt.id}>
              <TooltipTrigger asChild>
                <div className={cn("rounded-lg border p-4", status === "eligible" ? "border-success/30" : status === "verify" ? "border-warning/30" : "border-destructive/30")}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{lt.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{lt.minDownPayment}% down • {lt.minCreditScore}+ credit</p>
                    </div>
                    <Badge className={badgeClassName}>
                      <Icon className="w-3 h-3 mr-1" />
                      {badgeLabel}
                    </Badge>
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground">
                    Est. total DTI: <span className="font-medium text-foreground">{calc.backEndDTI}%</span>
                  </div>
                </div>
              </TooltipTrigger>

              <TooltipContent className="max-w-xs">
                <p className="font-medium mb-1">{lt.name}</p>
                <ul className="text-xs space-y-1">
                  {(reasons.length ? reasons : ["Based on inputs, you look on-track for this program"]).map((r) => (
                    <li key={r}>• {r}</li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </Card>
  );
}
