import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, ExternalLink, Home } from "lucide-react";
import { formatCurrency } from "@/lib/calculator";
import { useToast } from "@/hooks/use-toast";

interface SavedAnalysesProps {
  userId: string;
}

export function SavedAnalyses({ userId }: SavedAnalysesProps) {
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyses();
  }, [userId]);

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('property_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('property_analyses').delete().eq('id', id);
      if (error) throw error;
      setAnalyses(prev => prev.filter(a => a.id !== id));
      toast({ title: "Deleted", description: "Analysis removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Home className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Saved Analyses</h3>
          <p className="text-muted-foreground">Analyze a property and save it to see it here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {analyses.map((analysis) => (
        <Card key={analysis.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{analysis.property_address || "Property"}</CardTitle>
                <CardDescription>
                  {analysis.city && analysis.state ? `${analysis.city}, ${analysis.state}` : analysis.state}
                </CardDescription>
              </div>
              <span className="text-xl font-bold text-primary">{formatCurrency(analysis.property_price || 0)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {analysis.bedrooms && <Badge variant="secondary">{analysis.bedrooms} Beds</Badge>}
              {analysis.bathrooms && <Badge variant="secondary">{analysis.bathrooms} Baths</Badge>}
              <Badge variant="outline">{analysis.down_payment_percent}% Down</Badge>
              {analysis.qualifies !== null && (
                <Badge variant={analysis.qualifies ? "default" : "secondary"}>
                  {analysis.qualifies ? "Qualified" : "Review Needed"}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div><span className="text-muted-foreground">Monthly:</span> <strong>{formatCurrency(analysis.total_monthly_payment || 0)}</strong></div>
              <div><span className="text-muted-foreground">Cash to Close:</span> <strong>{formatCurrency(analysis.cash_to_close || 0)}</strong></div>
              <div><span className="text-muted-foreground">DTI:</span> <strong>{analysis.dti_ratio ? `${analysis.dti_ratio}%` : 'N/A'}</strong></div>
            </div>
            <div className="flex gap-2">
              {analysis.listing_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={analysis.listing_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 mr-1" /> View Listing
                  </a>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => handleDelete(analysis.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="w-3 h-3 mr-1" /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
