import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Gift, ExternalLink, RefreshCw } from "lucide-react";

interface AssistanceProgramsProps {
  state: string;
  city?: string;
  propertyPrice?: number;
  income?: number;
}

export function AssistancePrograms({ state, city, propertyPrice, income }: AssistanceProgramsProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ programs: any[]; resources: any[] } | null>(null);

  const fetchPrograms = async () => {
    if (!state) return;
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('get-assistance-programs', {
        body: { state, city, propertyPrice, income, isFirstTimeBuyer: true }
      });
      if (!error && result.success) {
        setData({ programs: result.programs, resources: result.resources });
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, [state]);

  const typeColors: Record<string, string> = {
    grant: "bg-green-100 text-green-800",
    loan: "bg-blue-100 text-blue-800",
    tax_credit: "bg-purple-100 text-purple-800",
    down_payment_assistance: "bg-yellow-100 text-yellow-800",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Assistance Programs
            </CardTitle>
            <CardDescription>Programs and resources available in {state}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchPrograms} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {data.programs.length > 0 && (
              <div className="space-y-3">
                {data.programs.map((program, i) => (
                  <div key={i} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium">{program.name}</h4>
                      <Badge className={typeColors[program.type] || "bg-gray-100 text-gray-800"}>
                        {program.type?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{program.description}</p>
                    {program.benefit && <p className="text-sm"><strong>Benefit:</strong> {program.benefit}</p>}
                    {program.eligibility && <p className="text-xs text-muted-foreground">{program.eligibility}</p>}
                    {program.website && (
                      <a href={program.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> View assistance program requirements
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div>
              <h4 className="font-medium mb-3">Helpful Resources</h4>
              <div className="grid gap-2">
                {data.resources.map((resource, i) => (
                  <a key={i} href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors">
                    <ExternalLink className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{resource.name}</p>
                      <p className="text-xs text-muted-foreground">{resource.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">No programs loaded yet</p>
        )}
      </CardContent>
    </Card>
  );
}
