import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { formatCurrency } from "@/lib/calculator";
import { Trash2, Home, TrendingUp, Bookmark, LogIn, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ComingSoonModal } from "@/components/common/ComingSoonModal";
import { ResultsDisclaimer } from "@/components/common/ResultsDisclaimer";

interface LocalScenario {
  id: string;
  type: "buyer" | "seller";
  state: string;
  homePrice: number;
  downPaymentPercent?: number;
  monthlyPayment?: number;
  dtiRatio?: number;
  totalCashNeeded?: number;
  hoaMonthly?: number;
  qualifies?: boolean;
  // seller fields
  remainingMortgage?: number;
  desiredSalePrice?: number;
  equity?: number;
  netAfterSale?: number;
  timestamp: string;
}

interface CloudScenario {
  id: string;
  state: string;
  home_price: number;
  down_payment_percent: number;
  monthly_payment: number | null;
  dti_ratio: number | null;
  total_cash_needed: number | null;
  hoa_monthly: number | null;
  qualifies: boolean | null;
  created_at: string;
}

const STORAGE_KEY = "throuly_saved_scenarios";

const SavedScenarios = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [localScenarios, setLocalScenarios] = useState<LocalScenario[]>([]);
  const [cloudScenarios, setCloudScenarios] = useState<CloudScenario[]>([]);
  const [comingSoonLabel, setComingSoonLabel] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    setLocalScenarios(saved);
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from("saved_results")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) setCloudScenarios(data);
        });
    }
  }, [user]);

  const deleteLocal = (id: string) => {
    const updated = localScenarios.filter((s) => s.id !== id);
    setLocalScenarios(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast({ title: "Deleted", description: "Scenario removed from device." });
  };

  const hasAny = localScenarios.length > 0 || cloudScenarios.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <h1 className="font-serif text-4xl text-foreground mb-3">Saved Scenarios</h1>
            <p className="text-muted-foreground">Your buyer and seller analyses in one place.</p>
          </div>

          {!hasAny ? (
            <Card className="p-12 text-center">
              <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No saved scenarios yet</p>
              <p className="text-muted-foreground mb-6">Run a buyer or seller analysis to save your first one.</p>
              <div className="flex gap-3 justify-center">
                <Link to="/buyers">
                  <Button variant="accent">Buyer Calculator</Button>
                </Link>
                <Button variant="outline" onClick={() => setComingSoonLabel("Seller Tools")}>
                  Seller Tools
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Local scenarios */}
              {localScenarios.length > 0 && (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Smartphone className="w-4 h-4" />
                    <span>Saved on this device</span>
                  </div>
                  {localScenarios.map((s) => (
                    <Card key={s.id} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">{s.type === "buyer" ? "Buyer" : "Seller"}</Badge>
                            <span className="text-sm text-muted-foreground">{s.state}</span>
                            {s.qualifies !== undefined && (
                              <Badge variant={s.qualifies ? "default" : "destructive"} className="text-xs">
                                {s.qualifies ? "Qualified" : "Not Qualified"}
                              </Badge>
                            )}
                          </div>
                          <p className="font-serif text-xl text-foreground mb-1">{formatCurrency(s.homePrice)}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            {s.downPaymentPercent != null && <span>{s.downPaymentPercent}% down</span>}
                            {s.monthlyPayment != null && <span>{formatCurrency(s.monthlyPayment)}/mo</span>}
                            {s.equity != null && <span>Equity: {formatCurrency(s.equity)}</span>}
                            <span>{new Date(s.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteLocal(s.id)}>
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </>
              )}

              {/* Cloud scenarios */}
              {cloudScenarios.length > 0 && (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 mt-6">
                    <Home className="w-4 h-4" />
                    <span>Saved to account</span>
                  </div>
                  {cloudScenarios.map((s) => (
                    <Card key={s.id} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">Buyer</Badge>
                            <span className="text-sm text-muted-foreground">{s.state}</span>
                            {s.qualifies !== null && (
                              <Badge variant={s.qualifies ? "default" : "destructive"} className="text-xs">
                                {s.qualifies ? "Qualified" : "Not Qualified"}
                              </Badge>
                            )}
                          </div>
                          <p className="font-serif text-xl text-foreground mb-1">{formatCurrency(s.home_price)}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span>{s.down_payment_percent}% down</span>
                            {s.monthly_payment && <span>{formatCurrency(s.monthly_payment)}/mo</span>}
                            <span>{new Date(s.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </>
              )}

              {/* Sign in prompt */}
              {!user && localScenarios.length > 0 && (
                <Card className="p-5 bg-primary/5 border-primary/20 mt-6">
                  <div className="flex items-center gap-3">
                    <LogIn className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground text-sm">Sign in to sync</p>
                      <p className="text-xs text-muted-foreground">
                        Create an account to save your scenarios across devices.
                      </p>
                    </div>
                    <Link to="/auth" className="ml-auto">
                      <Button variant="outline" size="sm">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}
            </div>
          )}

          {hasAny && <ResultsDisclaimer variant="footer" />}
        </div>
      </main>
      <Footer />
      <ComingSoonModal
        open={!!comingSoonLabel}
        label={comingSoonLabel || ""}
        onClose={() => setComingSoonLabel(null)}
      />
    </div>
  );
};

export default SavedScenarios;
