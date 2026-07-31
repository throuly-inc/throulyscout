import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, ArrowRight, Trash2, MapPin, TrendingUp, TrendingDown, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { StateAnalysis } from "@/lib/market-data";
import { ResultsDisclaimer } from "@/components/common/ResultsDisclaimer";
import { clearActiveBuyerSession } from "@/lib/buyerSessionStorage";
import { useToast } from "@/hooks/use-toast";

interface SavedAnalysis {
  id: string;
  scenario_name: string;
  inputs: Record<string, any>;
  results: StateAnalysis;
  created_at: string;
}

const fmtD = (n: number) => "$" + n.toLocaleString("en-US");

export default function ClientSavedAnalyses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadAnalyses();
  }, [user]);

  const loadAnalyses = async () => {
    const { data, error } = await supabase
      .from("saved_scenarios")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAnalyses(
        (data as unknown as SavedAnalysis[]).filter((s) => s.inputs?.type === "market_analysis"),
      );
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("saved_scenarios").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } else {
      setAnalyses((prev) => prev.filter((a) => a.id !== deleteId));
      toast({ title: "Deleted", description: "Analysis removed." });
    }
    setDeleteId(null);
  };

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
            <h2 className="font-serif text-2xl md:text-3xl text-foreground">My Saved Analyses</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {analyses.length} market {analyses.length === 1 ? "analysis" : "analyses"} saved from the Analyzer
            </p>
          </div>
          <Link to="/analyzer">
            <Button size="sm" variant="secondary">
              <Sparkles className="w-4 h-4 mr-1" /> New analysis
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : analyses.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center space-y-4">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-lg text-muted-foreground">No saved analyses yet.</p>
              <p className="text-sm text-muted-foreground">
                Use the{" "}
                <Link to="/analyzer" className="text-primary underline">
                  Market Analyzer
                </Link>{" "}
                and click "Save Analysis" on any result to save it here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {analyses.map((a) => {
              const r = a.results;
              const up = (r?.yoyChange?.pct ?? 0) > 0;
              return (
                <Card key={a.id} className="hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{a.scenario_name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="gap-1">
                            <MapPin className="w-3 h-3" />
                            {r?.stateName || a.inputs?.state || "—"}
                          </Badge>
                          {a.inputs?.isAddress && <Badge variant="outline">Property estimate</Badge>}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        Saved {format(new Date(a.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Median home price</div>
                        <div className="font-medium">{r ? fmtD(r.medianHomePrice) : "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Price trend</div>
                        <div
                          className={cn(
                            "font-medium flex items-center gap-1",
                            up ? "text-[hsl(var(--success))]" : "text-destructive",
                          )}
                        >
                          {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {r?.yoyChange?.pct != null ? `${r.yoyChange.pct > 0 ? "+" : ""}${r.yoyChange.pct}% YoY` : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Gross yield</div>
                        <div className="font-medium">{r?.grossYield != null ? `${r.grossYield}%` : "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Cap rate</div>
                        <div className="font-medium">{r?.capRate != null ? `${r.capRate}%` : "—"}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r?.stateAbbr && (
                        <Link to={`/buyers?state=${r.stateAbbr}`} onClick={clearActiveBuyerSession}>
                          <Button size="sm" variant="default">
                            Calculate affordability <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(a.id)}
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

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this analysis?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The saved analysis will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
