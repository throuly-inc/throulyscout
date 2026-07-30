import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gift, Save, Loader2 } from "lucide-react";
import { QualifyingPrograms } from "@/components/buyers/QualifyingPrograms";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { clearActiveBuyerSession } from "@/lib/buyerSessionStorage";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import { SEO } from "@/components/seo/SEO";

export default function BuyersPrograms() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();

  const stateName = params.get("state") || "";
  const homePrice = Number(params.get("homePrice")) || 0;
  const yearlyIncome = Number(params.get("income")) || 0;
  const isFirstTimeBuyer = params.get("firstTime") !== "false";

  const [user, setUser] = useState<User | null>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Sign in to save",
        description: "Create an account or sign in to save these programs to your dashboard.",
      });
      navigate("/auth");
      return;
    }
    if (programs.length === 0) {
      toast({
        title: "No programs to save",
        description: "Please wait for programs to load before saving.",
      });
      return;
    }
    setSaving(true);
    try {
      const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const { error } = await supabase.from("saved_scenarios" as any).insert({
        user_id: user.id,
        scenario_name: `Assistance Programs — ${stateName} (${dateStr})`,
        inputs: { state: stateName, homePrice, yearlyIncome, isFirstTimeBuyer, type: "assistance_programs" },
        results: { programs },
      });
      if (error) throw error;
      toast({
        title: "Saved to your account",
        description: "View these programs anytime from your dashboard.",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Couldn't save",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Buying Programs | Home Affordability Calculator — Throuly"
        description="See down payment assistance, grants, and first-time buyer programs matched to your profile, then run the numbers in Throuly's home affordability calculator."
        path="/buyers/programs"
      />
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <Button variant="ghost" size="lg" onClick={() => navigate(-1)} className="mb-4 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Results
        </Button>

        <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-6 h-6 text-accent" />
              <h1 className="font-serif text-2xl md:text-3xl text-foreground">Programs You May Qualify For</h1>
            </div>
            <p className="text-muted-foreground">
              Based on your profile in {stateName || "your state"}, here are assistance programs, grants, and tax
              credits you may be eligible for. Combine them with our{" "}
              <a href="/buyers" onClick={clearActiveBuyerSession} className="underline underline-offset-2 hover:text-foreground">home affordability calculator</a>{" "}
              to see your true buying power.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg" className="shrink-0">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save to My Account
          </Button>
        </div>

        {stateName ? (
          <QualifyingPrograms
            stateName={stateName}
            homePrice={homePrice}
            yearlyIncome={yearlyIncome}
            isFirstTimeBuyer={isFirstTimeBuyer}
            onProgramsLoaded={setPrograms}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Missing state information. Please return to your results and try again.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
