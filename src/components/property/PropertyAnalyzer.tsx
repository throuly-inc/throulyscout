import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Link2, DollarSign, Home, Percent, Calculator, Sparkles } from "lucide-react";
import { PropertyResults } from "./PropertyResults";
import { ManualPropertyEntry } from "./ManualPropertyEntry";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FinancialProfile {
  yearlyIncome: number;
  totalDebt: number;
  savings: number;
  monthlyExpenses: number;
  creditScore: number;
}

interface PropertyAnalyzerProps {
  userId: string;
}

export function PropertyAnalyzer({ userId }: PropertyAnalyzerProps) {
  const { toast } = useToast();
  const [listingUrl, setListingUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showFinancialProfile, setShowFinancialProfile] = useState(false);
  const [financialProfile, setFinancialProfile] = useState<FinancialProfile>({
    yearlyIncome: 75000,
    totalDebt: 500,
    savings: 50000,
    monthlyExpenses: 2000,
    creditScore: 720,
  });

  const handleAnalyze = async () => {
    if (!listingUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a Zillow or Redfin listing URL",
        variant: "destructive"
      });
      return;
    }

    setAnalyzing(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('throulyscout-analyze-property', {
        body: { 
          listingUrl,
          financialProfile: showFinancialProfile ? financialProfile : null
        }
      });

      if (error) throw error;

      if (data.success) {
        setResults(data);
        toast({
          title: "Analysis Complete",
          description: `Successfully analyzed property at ${data.property.address || 'the listing'}`,
        });
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze the listing. Try entering details manually.",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleManualSubmit = (propertyData: any) => {
    // Transform manual entry to match the API response format
    setResults({
      success: true,
      property: propertyData.property,
      calculations: propertyData.calculations,
      qualification: propertyData.qualification,
      listingUrl: null,
    });
  };

  const handleClear = () => {
    setResults(null);
    setListingUrl("");
  };

  if (results) {
    return (
      <PropertyResults 
        results={results} 
        userId={userId}
        onClear={handleClear}
        financialProfile={showFinancialProfile ? financialProfile : null}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="url" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="url" className="gap-2">
            <Link2 className="w-4 h-4" />
            Paste URL
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <Calculator className="w-4 h-4" />
            Enter Manually
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI-Powered Analysis
              </CardTitle>
              <CardDescription>
                Paste a Zillow or Redfin listing URL and we'll automatically extract property details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="listing-url">Property Listing URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="listing-url"
                    placeholder="https://www.zillow.com/homedetails/..."
                    value={listingUrl}
                    onChange={(e) => setListingUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleAnalyze} 
                    disabled={analyzing}
                    className="shrink-0"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Analyze
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported: Zillow, Redfin, Realtor.com, and most major listing sites
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Your Financial Profile
                <span className="text-xs font-normal text-muted-foreground ml-2">(Optional)</span>
              </CardTitle>
              <CardDescription>
                Add your financial details to see personalized qualification results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="include-profile"
                    checked={showFinancialProfile}
                    onChange={(e) => setShowFinancialProfile(e.target.checked)}
                    className="rounded border-input"
                  />
                  <Label htmlFor="include-profile" className="cursor-pointer">
                    Include my financial profile for qualification check
                  </Label>
                </div>

                {showFinancialProfile && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="income">Annual Income</Label>
                      <MoneyInput
                        id="income"
                        value={financialProfile.yearlyIncome}
                        onChange={(raw) => setFinancialProfile(prev => ({ ...prev, yearlyIncome: Number(raw) || 0 }))}
                        aria-label="Annual income"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="savings">Available Savings</Label>
                      <MoneyInput
                        id="savings"
                        value={financialProfile.savings}
                        onChange={(raw) => setFinancialProfile(prev => ({ ...prev, savings: Number(raw) || 0 }))}
                        aria-label="Available savings"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="debt">Monthly Debt Payments</Label>
                      <MoneyInput
                        id="debt"
                        value={financialProfile.totalDebt}
                        onChange={(raw) => setFinancialProfile(prev => ({ ...prev, totalDebt: Number(raw) || 0 }))}
                        aria-label="Monthly debt payments"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expenses">Monthly Expenses</Label>
                      <MoneyInput
                        id="expenses"
                        value={financialProfile.monthlyExpenses}
                        onChange={(raw) => setFinancialProfile(prev => ({ ...prev, monthlyExpenses: Number(raw) || 0 }))}
                        aria-label="Monthly expenses"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="credit">Credit Score</Label>
                      <Input
                        id="credit"
                        type="number"
                        min={300}
                        max={850}
                        value={financialProfile.creditScore}
                        onChange={(e) => setFinancialProfile(prev => ({ ...prev, creditScore: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-6">
          <ManualPropertyEntry 
            onSubmit={handleManualSubmit}
            financialProfile={showFinancialProfile ? financialProfile : null}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
