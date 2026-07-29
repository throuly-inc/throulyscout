import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ExternalLink, CheckCircle, XCircle, DollarSign, Home, Percent, Gift, ArrowLeft, Save } from "lucide-react";
import { formatCurrency } from "@/lib/calculator";
import { AssistancePrograms } from "./AssistancePrograms";
import { ResultsDisclaimer } from "@/components/common/ResultsDisclaimer";

interface PropertyResultsProps {
  results: any;
  userId: string;
  onClear: () => void;
  financialProfile: any;
}

export function PropertyResults({ results, userId, onClear, financialProfile }: PropertyResultsProps) {
  const { toast } = useToast();
  const [selectedDownPayment, setSelectedDownPayment] = useState("20%");
  const [saving, setSaving] = useState(false);

  const property = results.property;
  const calculations = results.calculations;
  const qualification = results.qualification;
  const calc = calculations[selectedDownPayment];

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('property_analyses').insert({
        user_id: userId,
        listing_url: results.listingUrl || '',
        property_address: property.address,
        property_price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        square_feet: property.squareFeet,
        property_type: property.propertyType,
        state: property.state,
        city: property.city,
        zip_code: property.zipCode,
        down_payment_percent: calc.downPaymentPercent,
        monthly_mortgage: calc.monthlyMortgage,
        monthly_property_tax: calc.monthlyPropertyTax,
        monthly_insurance: calc.monthlyInsurance,
        monthly_pmi: calc.monthlyPMI,
        monthly_hoa: calc.monthlyHOA,
        total_monthly_payment: calc.totalMonthlyPayment,
        closing_costs: calc.closingCosts,
        cash_to_close: calc.cashToClose,
        qualifies: qualification?.qualifies,
        dti_ratio: qualification?.dtiRatio,
        raw_property_data: results,
      });

      if (error) throw error;
      toast({ title: "Saved!", description: "Analysis saved to your dashboard" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onClear}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Analyze Another
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Analysis
        </Button>
      </div>

      {/* Property Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                {property.address || "Property Analysis"}
              </CardTitle>
              <CardDescription>
                {property.city && property.state ? `${property.city}, ${property.state}` : ''} 
                {property.zipCode ? ` ${property.zipCode}` : ''}
              </CardDescription>
            </div>
            <span className="text-2xl font-bold text-primary">{formatCurrency(property.price || 0)}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            {property.bedrooms && <Badge variant="secondary">{property.bedrooms} Beds</Badge>}
            {property.bathrooms && <Badge variant="secondary">{property.bathrooms} Baths</Badge>}
            {property.squareFeet && <Badge variant="secondary">{property.squareFeet.toLocaleString()} sqft</Badge>}
            {property.propertyType && <Badge variant="outline">{property.propertyType}</Badge>}
          </div>
          {results.listingUrl && (
            <a href={results.listingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 mt-4">
              <ExternalLink className="w-3 h-3" /> View Original Listing
            </a>
          )}
        </CardContent>
      </Card>

      {/* Qualification Status */}
      {qualification && (
        <Card className={qualification.qualifies ? "border-green-500/50 bg-green-500/5" : "border-yellow-500/50 bg-yellow-500/5"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {qualification.qualifies ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-yellow-500" />}
              {qualification.qualifies ? "You Likely Qualify!" : "May Need Adjustments"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className={qualification.creditScoreOk ? "text-green-600" : "text-yellow-600"}>
                <p className="font-medium">Credit Score</p>
                <p>{qualification.creditScoreOk ? "✓ Meets minimum" : "✗ Below 620"}</p>
              </div>
              <div className={qualification.dtiOk ? "text-green-600" : "text-yellow-600"}>
                <p className="font-medium">DTI Ratio</p>
                <p>{qualification.dtiRatio}% {qualification.dtiOk ? "✓" : "✗ > 43%"}</p>
              </div>
              <div className={qualification.savingsOk ? "text-green-600" : "text-yellow-600"}>
                <p className="font-medium">Savings</p>
                <p>{qualification.savingsOk ? "✓ Sufficient" : "✗ Need more"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Down Payment Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Down Payment Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 mb-6">
            {Object.keys(calculations).map((key) => (
              <Button
                key={key}
                variant={selectedDownPayment === key ? "default" : "outline"}
                onClick={() => setSelectedDownPayment(key)}
                className="text-sm"
              >
                {key}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Down Payment</p>
              <p className="text-lg font-bold">{formatCurrency(calc.downPaymentAmount)}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Closing Costs</p>
              <p className="text-lg font-bold">{formatCurrency(calc.closingCosts)}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Cash to Close</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(calc.cashToClose)}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Monthly Payment</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(calc.totalMonthlyPayment)}</p>
            </div>
          </div>

          <ResultsDisclaimer variant="inline" className="mt-4" />


          <div className="mt-4 pt-4 border-t space-y-2 text-sm">
            <div className="flex justify-between"><span>Principal & Interest</span><span>{formatCurrency(calc.monthlyMortgage)}</span></div>
            <div className="flex justify-between"><span>Property Tax</span><span>{formatCurrency(calc.monthlyPropertyTax)}</span></div>
            <div className="flex justify-between"><span>Insurance</span><span>{formatCurrency(calc.monthlyInsurance)}</span></div>
            {calc.monthlyPMI > 0 && <div className="flex justify-between"><span>PMI</span><span>{formatCurrency(calc.monthlyPMI)}</span></div>}
            {calc.monthlyHOA > 0 && <div className="flex justify-between"><span>HOA</span><span>{formatCurrency(calc.monthlyHOA)}</span></div>}
          </div>
        </CardContent>
      </Card>

      {/* Assistance Programs */}
      <AssistancePrograms 
        state={property.state} 
        city={property.city}
        propertyPrice={property.price}
        income={financialProfile?.yearlyIncome}
      />

      <ResultsDisclaimer variant="footer" />
    </div>
  );
}
