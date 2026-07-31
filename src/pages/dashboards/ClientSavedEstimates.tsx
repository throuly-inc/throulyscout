import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Trash2,
  Pencil,
  Eye,
  Home,
  Check,
  X,
  Loader2,
  Copy,
  GitCompare,
  MapPin,
} from "lucide-react";
import { formatCurrency } from "@/lib/calculator";
import { statesData } from "@/lib/states";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ResultsDisclaimer } from "@/components/common/ResultsDisclaimer";
import { clearActiveBuyerSession } from "@/lib/buyerSessionStorage";

interface SavedScenario {
  id: string;
  scenario_name: string;
  inputs: Record<string, any>;
  results: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

const MAX_SCENARIOS = 5;
const MAX_COMPARE = 3;

export default function ClientSavedEstimates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Duplicate flow
  const [duplicateSource, setDuplicateSource] = useState<SavedScenario | null>(null);
  const [duplicateState, setDuplicateState] = useState<string>("");
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    if (user) loadScenarios();
  }, [user]);

  const loadScenarios = async () => {
    // Sort by most recently updated (falls back to created_at if updated_at absent)
    const { data, error } = await supabase
      .from("saved_scenarios")
      .select("*")
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Exclude scenarios saved by other features that share this table
      // (e.g. saved market analyses, assistance-program lookups) so they
      // don't count against the calculator estimate limit below.
      setScenarios((data as unknown as SavedScenario[]).filter((s) => !s.inputs?.type));
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("saved_scenarios").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } else {
      setScenarios((prev) => prev.filter((s) => s.id !== deleteId));
      setSelectedIds((prev) => prev.filter((id) => id !== deleteId));
      toast({ title: "Deleted", description: "Estimate removed." });
    }
    setDeleteId(null);
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return;
    const { error } = await supabase
      .from("saved_scenarios")
      .update({ scenario_name: renameValue.trim() } as any)
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to rename.", variant: "destructive" });
    } else {
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, scenario_name: renameValue.trim(), updated_at: new Date().toISOString() }
            : s,
        ),
      );
    }
    setRenamingId(null);
  };

  const openDuplicate = (scenario: SavedScenario) => {
    if (scenarios.length >= MAX_SCENARIOS) {
      toast({
        title: "Save limit reached",
        description: `Delete an estimate to make room (max ${MAX_SCENARIOS}).`,
        variant: "destructive",
      });
      return;
    }
    setDuplicateSource(scenario);
    // Default target state = the source's state so the user can just change it
    setDuplicateState(scenario.inputs?.stateAbbreviation || "");
  };

  const confirmDuplicate = async () => {
    if (!duplicateSource || !user) return;
    if (!duplicateState) {
      toast({ title: "Pick a state", description: "Select a state to duplicate into.", variant: "destructive" });
      return;
    }
    const state = statesData.find((s) => s.abbreviation === duplicateState);
    if (!state) return;

    setIsDuplicating(true);
    try {
      const inputs = {
        ...(duplicateSource.inputs || {}),
        state: state.name,
        stateName: state.name,
        stateAbbreviation: state.abbreviation,
      };
      const name = `${duplicateSource.scenario_name} → ${state.abbreviation}`;
      const { data, error } = await supabase
        .from("saved_scenarios")
        .insert({
          user_id: user.id,
          scenario_name: name,
          inputs,
          // Results will be recalculated when the user opens the estimate
          results: duplicateSource.results || {},
        } as any)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (data) setScenarios((prev) => [data as any, ...prev]);
      toast({
        title: "Duplicated",
        description: `Open the new estimate to recalculate for ${state.name}.`,
      });
      setDuplicateSource(null);
      setDuplicateState("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to duplicate.", variant: "destructive" });
    } finally {
      setIsDuplicating(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) {
        toast({
          title: `Up to ${MAX_COMPARE} estimates`,
          description: "Deselect one to add another.",
        });
        return prev;
      }
      return [...prev, id];
    });
  };

  const compareItems = useMemo(
    () => selectedIds.map((id) => scenarios.find((s) => s.id === id)).filter(Boolean) as SavedScenario[],
    [selectedIds, scenarios],
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto p-6 pt-24 space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/client">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
          <div className="flex-1">
            <h2 className="font-serif text-2xl md:text-3xl text-foreground">My Saved Estimates</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {scenarios.length} of {MAX_SCENARIOS} estimates saved · sorted by most recently updated
            </p>
          </div>
          {scenarios.length >= 2 && (
            <div className="flex items-center gap-2">
              {compareMode && (
                <Button
                  size="sm"
                  variant="default"
                  disabled={selectedIds.length < 2}
                  onClick={() => setShowCompare(true)}
                >
                  <GitCompare className="w-4 h-4 mr-1" />
                  Compare {selectedIds.length || ""}
                </Button>
              )}
              <Button
                size="sm"
                variant={compareMode ? "outline" : "secondary"}
                onClick={() => {
                  setCompareMode((m) => !m);
                  setSelectedIds([]);
                }}
              >
                {compareMode ? "Done" : "Compare estimates"}
              </Button>
            </div>
          )}
        </div>

        {scenarios.length >= MAX_SCENARIOS && (
          <Card className="p-4 bg-warning/5 border-warning/40">
            <p className="text-sm text-foreground">
              You've reached the {MAX_SCENARIOS}-estimate limit. Delete one below to make room for a new save.
            </p>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : scenarios.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center space-y-4">
              <Home className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-lg text-muted-foreground">No saved estimates yet.</p>
              <p className="text-sm text-muted-foreground">
                Use the{" "}
                <Link to="/buyers" onClick={clearActiveBuyerSession} className="text-primary underline">
                  affordability calculator
                </Link>{" "}
                and click "Save estimate" to save it here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {scenarios.map((scenario) => {
              const state =
                scenario.inputs?.state || scenario.inputs?.stateName || scenario.inputs?.stateAbbreviation || "—";
              const stateAbbr = scenario.inputs?.stateAbbreviation;
              const income = scenario.inputs?.yearlyIncome;
              const downPct = scenario.inputs?.downPaymentPercent;
              const debts = scenario.inputs?.monthlyDebt;
              const maxAff = scenario.results?.maxAffordablePrice;
              const monthly = scenario.results?.totalMonthlyPayment;
              const qual = scenario.results?.qualificationStatus;
              const updated = scenario.updated_at || scenario.created_at;
              const isSelected = selectedIds.includes(scenario.id);

              return (
                <Card
                  key={scenario.id}
                  className={`hover:border-primary/30 transition-colors ${isSelected ? "border-primary ring-1 ring-primary/20" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {compareMode && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(scenario.id)}
                            className="mt-1"
                            aria-label={`Select ${scenario.scenario_name}`}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          {renamingId === scenario.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                className="h-8 text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleRename(scenario.id);
                                  if (e.key === "Escape") setRenamingId(null);
                                }}
                              />
                              <Button size="sm" variant="ghost" onClick={() => handleRename(scenario.id)}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setRenamingId(null)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <CardTitle className="text-base truncate">{scenario.scenario_name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="secondary" className="gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {stateAbbr ? `${state} (${stateAbbr})` : state}
                                </Badge>
                                {qual && (
                                  <Badge
                                    variant={
                                      qual === "qualified" || qual === "strong"
                                        ? "default"
                                        : qual === "unlikely"
                                          ? "destructive"
                                          : "secondary"
                                    }
                                  >
                                    {qual === "qualified" || qual === "strong"
                                      ? "Qualifies"
                                      : qual === "unlikely"
                                        ? "Not qualified"
                                        : "Review"}
                                  </Badge>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        Updated {format(new Date(updated), "MMM d, yyyy")}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Income</div>
                        <div className="font-medium">{income ? formatCurrency(income) : "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Down payment</div>
                        <div className="font-medium">{downPct != null ? `${downPct}%` : "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Monthly debts</div>
                        <div className="font-medium">{debts != null ? formatCurrency(debts) : "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Max affordable</div>
                        <div className="font-medium text-primary">
                          {maxAff ? formatCurrency(maxAff) : "—"}
                        </div>
                      </div>
                    </div>
                    {monthly && (
                      <div className="text-sm text-muted-foreground mb-4">
                        Estimated monthly: <strong className="text-foreground">{formatCurrency(monthly)}</strong>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/buyers?scenario=${scenario.id}`}>
                        <Button size="sm" variant="default">
                          <Eye className="w-4 h-4 mr-1" /> Open & edit
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline" onClick={() => openDuplicate(scenario)}>
                        <Copy className="w-4 h-4 mr-1" /> Duplicate for another state
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRenamingId(scenario.id);
                          setRenameValue(scenario.scenario_name);
                        }}
                      >
                        <Pencil className="w-4 h-4 mr-1" /> Rename
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(scenario.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <ResultsDisclaimer variant="footer" />
      </main>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this estimate?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The saved estimate will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate for a different state */}
      <Dialog open={!!duplicateSource} onOpenChange={(open) => !open && setDuplicateSource(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Duplicate for another state</DialogTitle>
            <DialogDescription>
              Keep the same income, debts, and down payment — swap only the state to see how buying power changes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="dup-state">Target state</Label>
            <Select value={duplicateState} onValueChange={setDuplicateState}>
              <SelectTrigger id="dup-state">
                <SelectValue placeholder="Pick a state" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {statesData.map((s) => (
                  <SelectItem key={s.abbreviation} value={s.abbreviation}>
                    {s.name} ({s.abbreviation})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateSource(null)}>
              Cancel
            </Button>
            <Button onClick={confirmDuplicate} disabled={isDuplicating || !duplicateState}>
              {isDuplicating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Create duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compare side-by-side */}
      <Dialog open={showCompare} onOpenChange={setShowCompare}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Side-by-side comparison</DialogTitle>
            <DialogDescription>
              How your buying power shifts across {compareItems.length} saved estimates.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Metric</th>
                  {compareItems.map((s) => (
                    <th key={s.id} className="text-left py-2 pr-4 font-medium">
                      {s.scenario_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: "State",
                    val: (s: SavedScenario) =>
                      s.inputs?.stateAbbreviation
                        ? `${s.inputs?.state || s.inputs?.stateName} (${s.inputs.stateAbbreviation})`
                        : s.inputs?.state || "—",
                  },
                  {
                    label: "Yearly income",
                    val: (s: SavedScenario) =>
                      s.inputs?.yearlyIncome ? formatCurrency(s.inputs.yearlyIncome) : "—",
                  },
                  {
                    label: "Monthly debt",
                    val: (s: SavedScenario) =>
                      s.inputs?.monthlyDebt != null ? formatCurrency(s.inputs.monthlyDebt) : "—",
                  },
                  {
                    label: "Down payment %",
                    val: (s: SavedScenario) =>
                      s.inputs?.downPaymentPercent != null ? `${s.inputs.downPaymentPercent}%` : "—",
                  },
                  {
                    label: "Loan type",
                    val: (s: SavedScenario) => (s.inputs?.loanTypeId ? String(s.inputs.loanTypeId).toUpperCase() : "—"),
                  },
                  {
                    label: "Max affordable price",
                    val: (s: SavedScenario) =>
                      s.results?.maxAffordablePrice ? formatCurrency(s.results.maxAffordablePrice) : "—",
                    highlight: true,
                  },
                  {
                    label: "Estimated monthly",
                    val: (s: SavedScenario) =>
                      s.results?.totalMonthlyPayment ? formatCurrency(s.results.totalMonthlyPayment) : "—",
                  },
                  {
                    label: "Cash to close",
                    val: (s: SavedScenario) =>
                      s.results?.totalCashNeeded ? formatCurrency(s.results.totalCashNeeded) : "—",
                  },
                  {
                    label: "Qualification",
                    val: (s: SavedScenario) => s.results?.qualificationStatus || "—",
                  },
                ].map((row) => (
                  <tr key={row.label} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-muted-foreground">{row.label}</td>
                    {compareItems.map((s) => (
                      <td
                        key={s.id}
                        className={`py-2 pr-4 ${row.highlight ? "font-semibold text-primary" : "text-foreground"}`}
                      >
                        {row.val(s)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompare(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
