import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Layers, Plus, Trash2, Check, GitCompare, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateMortgage, formatCurrency } from "@/lib/calculator";
import { statesData } from "@/lib/states";
import { supabase } from "@/integrations/supabase/client";


export interface BuyerScenarioInputs {
  stateName: string;
  stateAbbreviation: string;
  homePrice: number;
  hoaMonthly: number;
  loanTypeId: string;
  downPaymentPercent: number;
  yearlyIncome: number;
  monthlyDebt: number;
  savings: number;
  creditScore: number;
  isFirstTimeBuyer: boolean;
}

export interface BuyerScenario {
  id: string;
  name: string;
  createdAt: string;
  inputs: BuyerScenarioInputs;
  snapshot?: {
    monthlyPayment: number;
    maxAffordable: number;
  };
}

const STORAGE_KEY = "throuly_buyer_scenarios_v1";
const MAX_COMPARE = 3;
const MIN_COMPARE = 2;

function readAll(): BuyerScenario[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeAll(list: BuyerScenario[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

interface Props {
  currentInputs?: BuyerScenarioInputs;
  currentSnapshot?: { monthlyPayment: number; maxAffordable: number };
  onLoad: (inputs: BuyerScenarioInputs) => void;
  /** When provided, scenarios are loaded from and persisted to the user's account. */
  userId?: string | null;
}

function mapDbRowToScenario(row: any): BuyerScenario | null {
  const inp = row?.inputs || {};
  const res = row?.results || {};
  const stateName: string = inp.state || "";
  const stateAbbr: string =
    inp.stateAbbreviation ||
    statesData.find((s) => s.name.toLowerCase() === stateName.toLowerCase())?.abbreviation ||
    "";
  if (!stateAbbr && !stateName) return null;
  return {
    id: row.id,
    name: row.scenario_name || `${stateName || stateAbbr} scenario`,
    createdAt: row.created_at,
    inputs: {
      stateName,
      stateAbbreviation: stateAbbr,
      homePrice: Number(inp.homePrice) || 0,
      hoaMonthly: Number(inp.hoaMonthly) || 0,
      loanTypeId: inp.loanTypeId || "conventional",
      downPaymentPercent: Number(inp.downPaymentPercent) || 20,
      yearlyIncome: Number(inp.yearlyIncome) || 0,
      monthlyDebt: Number(inp.monthlyDebt) || 0,
      savings: Number(inp.savings) || 0,
      creditScore: Number(inp.creditScore) || 720,
      isFirstTimeBuyer: !!inp.isFirstTimeBuyer,
    },
    snapshot: {
      monthlyPayment: Number(res.totalMonthlyPayment) || 0,
      maxAffordable: Number(res.maxAffordablePrice) || 0,
    },
  };
}

export function ScenarioSwitcher({ currentInputs, currentSnapshot, onLoad, userId }: Props) {
  const { toast } = useToast();
  const [scenarios, setScenarios] = useState<BuyerScenario[]>([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadFromDb = async (uid: string) => {
    const { data } = await supabase
      .from("saved_scenarios")
      .select("*")
      .eq("user_id", uid)
      .neq("scenario_name", "Financial Health Report")
      .order("created_at", { ascending: false })
      .limit(5);
    const mapped = ((data as any[]) || [])
      .map(mapDbRowToScenario)
      .filter((s): s is BuyerScenario => Boolean(s));
    setScenarios(mapped);
  };

  useEffect(() => {
    if (userId) {
      loadFromDb(userId);
    } else {
      setScenarios(readAll());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSave = async () => {
    if (!currentInputs) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast({ title: "Name required", description: "Give this scenario a short name.", variant: "destructive" });
      return;
    }
    if (userId) {
      const { error } = await supabase.from("saved_scenarios").insert({
        user_id: userId,
        scenario_name: trimmed,
        inputs: {
          state: currentInputs.stateName,
          stateAbbreviation: currentInputs.stateAbbreviation,
          homePrice: currentInputs.homePrice,
          hoaMonthly: currentInputs.hoaMonthly,
          loanTypeId: currentInputs.loanTypeId,
          downPaymentPercent: currentInputs.downPaymentPercent,
          yearlyIncome: currentInputs.yearlyIncome,
          monthlyDebt: currentInputs.monthlyDebt,
          savings: currentInputs.savings,
          creditScore: currentInputs.creditScore,
          isFirstTimeBuyer: currentInputs.isFirstTimeBuyer,
        },
        results: currentSnapshot
          ? {
              totalMonthlyPayment: currentSnapshot.monthlyPayment,
              maxAffordablePrice: currentSnapshot.maxAffordable,
            }
          : {},
      });
      if (error) {
        toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
        return;
      }
      await loadFromDb(userId);
    } else {
      const next: BuyerScenario = {
        id: crypto.randomUUID(),
        name: trimmed,
        createdAt: new Date().toISOString(),
        inputs: currentInputs,
        snapshot: currentSnapshot,
      };
      const list = [next, ...readAll()].slice(0, 5);
      writeAll(list);
      setScenarios(list);
      setActiveId(next.id);
    }
    setName("");
    setSaveOpen(false);
    toast({ title: "Scenario saved", description: `"${trimmed}" is ready to switch to anytime.` });
  };

  const handleLoad = (s: BuyerScenario) => {
    onLoad(s.inputs);
    setActiveId(s.id);
    toast({ title: "Scenario loaded", description: `Switched to "${s.name}".` });
  };

  const handleDelete = async () => {
    const id = deleteId;
    if (!id) return;
    if (userId) {
      const { error } = await supabase.from("saved_scenarios").delete().eq("id", id);
      if (error) {
        toast({ title: "Couldn't delete", description: error.message, variant: "destructive" });
        setDeleteId(null);
        return;
      }
      setScenarios((prev) => prev.filter((s) => s.id !== id));
    } else {
      const list = readAll().filter((s) => s.id !== id);
      writeAll(list);
      setScenarios(list);
    }
    if (activeId === id) setActiveId(null);
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    setDeleteId(null);
  };


  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((sid) => sid !== id);
      if (prev.length >= MAX_COMPARE) {
        toast({
          title: "Up to 3 scenarios",
          description: "Deselect one before adding another.",
        });
        return prev;
      }
      return [...prev, id];
    });
  };

  const enterCompareMode = () => {
    setCompareMode(true);
    setSelectedIds([]);
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setSelectedIds([]);
  };

  const openCompare = () => {
    if (selectedIds.length < MIN_COMPARE) {
      toast({ title: "Select at least 2", description: "Pick 2–3 scenarios to compare." });
      return;
    }
    setCompareOpen(true);
  };

  const comparisonRows = useMemo(() => {
    if (!compareOpen) return [];
    const chosen = selectedIds
      .map((id) => scenarios.find((s) => s.id === id))
      .filter((s): s is BuyerScenario => Boolean(s));
    return chosen.map((s) => {
      const stateData =
        statesData.find(
          (st) => st.abbreviation === s.inputs.stateAbbreviation || st.name === s.inputs.stateName,
        ) || statesData[0];
      const calc = calculateMortgage(
        s.inputs.homePrice,
        s.inputs.downPaymentPercent,
        stateData,
        {
          yearlyIncome: s.inputs.yearlyIncome,
          monthlyDebt: s.inputs.monthlyDebt,
          savings: s.inputs.savings,
          creditScore: s.inputs.creditScore,
          isFirstTimeBuyer: s.inputs.isFirstTimeBuyer,
        },
        s.inputs.hoaMonthly,
        s.inputs.loanTypeId,
      );
      return { scenario: s, stateData, calc };
    });
  }, [compareOpen, selectedIds, scenarios]);

  const bestMaxPrice = useMemo(
    () => Math.max(0, ...comparisonRows.map((r) => r.calc.maxAffordablePrice)),
    [comparisonRows],
  );

  return (
    <Card className="p-4 border-dashed">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-sm">Saved scenarios</h3>
          {scenarios.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {scenarios.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {compareMode ? (
            <>
              <Button
                size="sm"
                onClick={openCompare}
                disabled={selectedIds.length < MIN_COMPARE}
              >
                <GitCompare className="w-3.5 h-3.5 mr-1" />
                Compare {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
              </Button>
              <Button size="sm" variant="ghost" onClick={exitCompareMode}>
                <X className="w-3.5 h-3.5 mr-1" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              {scenarios.length >= MIN_COMPARE && (
                <Button size="sm" variant="ghost" onClick={enterCompareMode}>
                  <GitCompare className="w-3.5 h-3.5 mr-1" />
                  Compare
                </Button>
              )}
              {currentInputs && (
                <Button size="sm" variant="outline" onClick={() => setSaveOpen(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Save current
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {compareMode && (
        <p className="text-xs text-muted-foreground mb-2">
          Select 2–3 scenarios to see side-by-side buying power by state.
        </p>
      )}

      {scenarios.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Save this setup to compare it against different income, down payment, or debt combinations later.
        </p>
      ) : (
        <ul className="space-y-2">
          {scenarios.map((s) => {
            const isActive = s.id === activeId;
            const isSelected = selectedIds.includes(s.id);
            return (
              <li
                key={s.id}
                className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${
                  isSelected
                    ? "border-accent bg-accent/10"
                    : isActive
                      ? "border-accent bg-accent/5"
                      : "border-border"
                }`}
              >
                {compareMode && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(s.id)}
                    aria-label={`Select ${s.name} to compare`}
                  />
                )}
                <button
                  type="button"
                  onClick={() => (compareMode ? toggleSelect(s.id) : handleLoad(s))}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="flex items-center gap-1.5">
                    {!compareMode && isActive && (
                      <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                    )}
                    <span className="font-medium truncate">{s.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {s.inputs.stateAbbreviation} · {formatCurrency(s.inputs.homePrice)} ·{" "}
                    {s.inputs.downPaymentPercent}% down · {formatCurrency(s.inputs.yearlyIncome)}/yr
                  </div>
                </button>
                {!compareMode && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={() => setDeleteId(s.id)}
                    aria-label={`Delete ${s.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save this scenario</DialogTitle>
            <DialogDescription>
              Give it a name so you can switch back after tweaking income, down payment, or debt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="scenario-name">Scenario name</Label>
            <Input
              id="scenario-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Baseline, 20% down, Higher income"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
            <p className="text-xs text-muted-foreground">
              Saved to this device — no account needed.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save scenario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Buying power side-by-side</DialogTitle>
            <DialogDescription>
              Same profile, different states or setups. Highest max price is highlighted.
            </DialogDescription>
          </DialogHeader>

          {comparisonRows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3 font-medium text-muted-foreground w-40">
                      Metric
                    </th>
                    {comparisonRows.map(({ scenario }) => (
                      <th
                        key={scenario.id}
                        className="text-left py-2 px-3 font-semibold min-w-[160px]"
                      >
                        <div className="truncate">{scenario.name}</div>
                        <div className="text-xs font-normal text-muted-foreground">
                          {scenario.inputs.stateAbbreviation} ·{" "}
                          {scenario.inputs.loanTypeId.toUpperCase()}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="[&_tr]:border-b">
                  <Row label="State">
                    {comparisonRows.map(({ scenario, stateData }) => (
                      <td key={scenario.id} className="py-2 px-3">
                        {stateData.name}
                      </td>
                    ))}
                  </Row>
                  <Row label="Max home price" highlight>
                    {comparisonRows.map(({ scenario, calc }) => (
                      <td
                        key={scenario.id}
                        className={`py-2 px-3 font-semibold ${
                          calc.maxAffordablePrice === bestMaxPrice && bestMaxPrice > 0
                            ? "text-accent"
                            : ""
                        }`}
                      >
                        {formatCurrency(calc.maxAffordablePrice)}
                      </td>
                    ))}
                  </Row>
                  <Row label="Current home price">
                    {comparisonRows.map(({ scenario }) => (
                      <td key={scenario.id} className="py-2 px-3">
                        {formatCurrency(scenario.inputs.homePrice)}
                      </td>
                    ))}
                  </Row>
                  <Row label="Monthly payment">
                    {comparisonRows.map(({ scenario, calc }) => (
                      <td key={scenario.id} className="py-2 px-3">
                        {formatCurrency(calc.totalMonthlyPayment)}
                      </td>
                    ))}
                  </Row>
                  <Row label="Down payment">
                    {comparisonRows.map(({ scenario, calc }) => (
                      <td key={scenario.id} className="py-2 px-3">
                        {formatCurrency(calc.downPaymentAmount)} ({scenario.inputs.downPaymentPercent}%)
                      </td>
                    ))}
                  </Row>
                  <Row label="Cash to close">
                    {comparisonRows.map(({ scenario, calc }) => (
                      <td key={scenario.id} className="py-2 px-3">
                        {formatCurrency(calc.totalCashNeeded)}
                      </td>
                    ))}
                  </Row>
                  <Row label="Property tax / mo">
                    {comparisonRows.map(({ scenario, calc }) => (
                      <td key={scenario.id} className="py-2 px-3">
                        {formatCurrency(calc.monthlyPropertyTax)}
                      </td>
                    ))}
                  </Row>
                  <Row label="Insurance / mo">
                    {comparisonRows.map(({ scenario, calc }) => (
                      <td key={scenario.id} className="py-2 px-3">
                        {formatCurrency(calc.monthlyInsurance)}
                      </td>
                    ))}
                  </Row>
                  <Row label="Yearly income">
                    {comparisonRows.map(({ scenario }) => (
                      <td key={scenario.id} className="py-2 px-3">
                        {formatCurrency(scenario.inputs.yearlyIncome)}
                      </td>
                    ))}
                  </Row>
                  <Row label="Monthly debt">
                    {comparisonRows.map(({ scenario }) => (
                      <td key={scenario.id} className="py-2 px-3">
                        {formatCurrency(scenario.inputs.monthlyDebt)}
                      </td>
                    ))}
                  </Row>
                  <Row label="Savings">
                    {comparisonRows.map(({ scenario }) => (
                      <td key={scenario.id} className="py-2 px-3">
                        {formatCurrency(scenario.inputs.savings)}
                      </td>
                    ))}
                  </Row>
                  <Row label="Credit score">
                    {comparisonRows.map(({ scenario }) => (
                      <td key={scenario.id} className="py-2 px-3">
                        {scenario.inputs.creditScore}
                      </td>
                    ))}
                  </Row>
                </tbody>
              </table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCompareOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this scenario?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The saved scenario will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function Row({
  label,
  highlight,
  children,
}: {
  label: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <tr className={highlight ? "bg-accent/5" : ""}>
      <td className="py-2 pr-3 text-muted-foreground text-xs uppercase tracking-wide">{label}</td>
      {children}
    </tr>
  );
}
