import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GenericResults } from "@/components/buyers/GenericResults";
import { StateData } from "@/lib/states";
import { FinancialProfile } from "@/lib/calculator";
import { SEO } from "@/components/seo/SEO";
import { useToast } from "@/hooks/use-toast";
import { usePrivacy } from "@/contexts/PrivacyContext";

const SESSION_KEY = "throuly_buyers_session";
const EDITING_KEY = "throuly_editing_scenario";

type BuyersSession = {
  selectedState: StateData;
  homePrice: number;
  hoaMonthly: number;
  financialProfile: FinancialProfile;
  loanTypeId: string;
};

type EditingMarker = { id: string; name: string } | null;

function readSession(): BuyersSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as BuyersSession) : null;
  } catch {
    return null;
  }
}

function readEditing(): EditingMarker {
  try {
    const raw = sessionStorage.getItem(EDITING_KEY);
    return raw ? (JSON.parse(raw) as EditingMarker) : null;
  } catch {
    return null;
  }
}

export default function HomebuyingResults() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { guardSave } = usePrivacy();
  const session = useMemo(readSession, []);
  const editing = useMemo(readEditing, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!session) navigate("/buyers", { replace: true });
  }, [session, navigate]);

  if (!session) return null;

  const handleSave = () => {
    if (!guardSave("save your results")) return;
    // GenericResults handles the actual DB write + toast; nothing to duplicate here.
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Your Homebuying Estimate — Results | Throuly"
        description="Your affordability results based on your financial health, DTI, and savings."
        path="/homebuying-estimate/results"
      />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto mb-4">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {editing ? `Editing · ${editing.name}` : "Step 2 of 2 · Affordability results"}
            </p>
          </div>
          <GenericResults
            state={session.selectedState}
            homePrice={session.homePrice}
            hoaMonthly={session.hoaMonthly}
            financialProfile={session.financialProfile}
            loanTypeId={session.loanTypeId}
            onBack={() => navigate("/homebuying-estimate/financial-health")}
            onSave={handleSave}
            editingScenarioId={editing?.id ?? null}
            editingScenarioName={editing?.name ?? null}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
