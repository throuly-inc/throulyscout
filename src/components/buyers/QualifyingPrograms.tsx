import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, ExternalLink, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface QualifyingProgramsProps {
  stateName: string;
  homePrice: number;
  yearlyIncome: number;
  isFirstTimeBuyer?: boolean;
  onProgramsLoaded?: (programs: AssistanceProgram[]) => void;
}

interface AssistanceProgram {
  name: string;
  type: string;
  description: string;
  eligibility?: string;
  benefit?: string;
  website?: string | null;
}

const programTypeColors: Record<string, string> = {
  grant: "bg-success/15 text-success border-success/30",
  loan: "bg-primary/15 text-primary border-primary/30",
  tax_credit: "bg-accent/15 text-accent border-accent/30",
  down_payment_assistance: "bg-warning/15 text-warning border-warning/30",
};

export function QualifyingPrograms({ stateName, homePrice, yearlyIncome, isFirstTimeBuyer, onProgramsLoaded }: QualifyingProgramsProps) {
  const [programs, setPrograms] = useState<AssistanceProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const fetchPrograms = async () => {
    if (!stateName) return;
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("throulyscout-get-assistance-programs", {
        body: {
          state: stateName,
          propertyPrice: homePrice,
          income: yearlyIncome,
          isFirstTimeBuyer: isFirstTimeBuyer ?? true,
        },
      });
      if (!error && result?.success) {
        const list = result.programs || [];
        setPrograms(list);
        onProgramsLoaded?.(list);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setFetched(true);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, [stateName]);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between rounded-lg border bg-card px-3 py-2.5 hover:bg-accent/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-accent" />
          <p className="text-sm font-semibold text-foreground">Programs You May Qualify For</p>
          {programs.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {programs.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {fetched && !loading && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                fetchPrograms();
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh programs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-2">
          {loading ? (
            <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Finding programs in {stateName}…
            </div>
          ) : programs.length > 0 ? (
            <div className="space-y-2">
              {programs.map((program, i) => (
                <Card key={i} className="p-3 border border-border bg-card">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground leading-snug">{program.name}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs shrink-0",
                        programTypeColors[program.type] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {program.type?.replace("_", " ")}
                    </Badge>
                  </div>
                  {program.benefit && <p className="text-xs font-medium text-accent mb-1">{program.benefit}</p>}
                  <p className="text-xs text-muted-foreground leading-relaxed">{program.description}</p>
                  {program.eligibility && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{program.eligibility}</p>
                  )}
                  {program.website && (
                    <a
                      href={program.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View program details
                    </a>
                  )}
                </Card>
              ))}
            </div>
          ) : fetched ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No programs found for {stateName} at this time.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
