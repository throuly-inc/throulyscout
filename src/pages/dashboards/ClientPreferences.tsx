import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Search, X } from "lucide-react";
import { US_STATES } from "@/lib/states";
import { useToast } from "@/hooks/use-toast";
import { ComingSoonModal } from "@/components/common/ComingSoonModal";

const PROPERTY_TYPES = [
  { value: "any", label: "Any" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
];

const TIMELINES = [
  { value: "immediately", label: "Immediately" },
  { value: "1-3 months", label: "1–3 Months" },
  { value: "3-6 months", label: "3–6 Months" },
  { value: "6-12 months", label: "6–12 Months" },
  { value: "just browsing", label: "Just Browsing" },
];


export default function ClientPreferences() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [citiesInput, setCitiesInput] = useState("");
  const [propertyType, setPropertyType] = useState("any");
  const [bedroomsMin, setBedroomsMin] = useState("1");
  const [timeline, setTimeline] = useState("just browsing");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  const [comingSoonLabel, setComingSoonLabel] = useState<string | null>(null);

  // Load existing preferences
  useEffect(() => {
    if (!user) return;
    supabase
      .from("buyer_questionnaires")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setBudgetMin(data.budget_min?.toString() || "");
          setBudgetMax(data.budget_max?.toString() || "");
          setSelectedStates((data.preferred_states as string[]) || []);
          setCitiesInput((data.preferred_cities as string[])?.join(", ") || "");
          setPropertyType(data.property_type || "any");
          setBedroomsMin(data.bedrooms_min?.toString() || "1");
          setTimeline(data.timeline || "just browsing");
          setSaved(true);
        }
        setLoadingPrefs(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const cities = citiesInput.split(",").map((c) => c.trim()).filter(Boolean);

    const payload = {
      user_id: user.id,
      budget_min: budgetMin ? Number(budgetMin) : null,
      budget_max: budgetMax ? Number(budgetMax) : null,
      preferred_states: selectedStates,
      preferred_cities: cities,
      property_type: propertyType,
      bedrooms_min: Number(bedroomsMin) || 1,
      timeline,
    };

    const { error } = await supabase
      .from("buyer_questionnaires")
      .upsert(payload, { onConflict: "user_id" });

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Preferences Saved" });
      setSaved(true);
    }
  };


  const addState = (val: string) => {
    if (val && !selectedStates.includes(val)) {
      setSelectedStates((prev) => [...prev, val]);
    }
  };

  const removeState = (val: string) => {
    setSelectedStates((prev) => prev.filter((s) => s !== val));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b flex items-center px-6 justify-between">
        <Link to="/dashboard/client">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Button>
        </Link>
        <h1 className="font-serif text-xl text-foreground">My Preferences</h1>
        <div />
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {loadingPrefs ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Buyer Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Budget */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Budget Min ($)</Label>
                    <MoneyInput placeholder="100,000" value={budgetMin} onChange={setBudgetMin} aria-label="Budget minimum" />
                  </div>
                  <div className="space-y-2">
                    <Label>Budget Max ($)</Label>
                    <MoneyInput placeholder="500,000" value={budgetMax} onChange={setBudgetMax} aria-label="Budget maximum" />
                  </div>
                </div>

                {/* States */}
                <div className="space-y-2">
                  <Label>Preferred States</Label>
                  <Select onValueChange={addState}>
                    <SelectTrigger><SelectValue placeholder="Add a state" /></SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedStates.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedStates.map((s) => (
                        <Badge key={s} variant="secondary" className="gap-1">
                          {s}
                          <button onClick={() => removeState(s)}>
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cities */}
                <div className="space-y-2">
                  <Label>Preferred Cities (comma separated)</Label>
                  <Input placeholder="Austin, Denver, Nashville" value={citiesInput} onChange={(e) => setCitiesInput(e.target.value)} />
                </div>

                {/* Property Type */}
                <div className="space-y-2">
                  <Label>Property Type</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bedrooms */}
                <div className="space-y-2">
                  <Label>Minimum Bedrooms</Label>
                  <Input type="number" min={1} value={bedroomsMin} onChange={(e) => setBedroomsMin(e.target.value)} />
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                  <Label>Timeline</Label>
                  <Select value={timeline} onValueChange={setTimeline}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIMELINES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="accent" className="w-full" onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving…" : "Save Preferences"}
                </Button>
              </CardContent>
            </Card>

            {saved && (
              <Button variant="default" className="w-full" onClick={() => setComingSoonLabel("View Matches")}>
                <Search className="w-4 h-4 mr-2" />
                View Matches
              </Button>
            )}
          </>
        )}
      </main>

      <ComingSoonModal
        open={!!comingSoonLabel}
        label={comingSoonLabel || ""}
        onClose={() => setComingSoonLabel(null)}
      />
    </div>
  );
}
