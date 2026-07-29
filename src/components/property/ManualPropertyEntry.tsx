import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Home } from "lucide-react";
import { statesData } from "@/lib/states";

interface FinancialProfile {
  yearlyIncome: number;
  totalDebt: number;
  savings: number;
  monthlyExpenses: number;
  creditScore: number;
}

interface ManualPropertyEntryProps {
  onSubmit: (data: any) => void;
  financialProfile: FinancialProfile | null;
}

export function ManualPropertyEntry({ onSubmit, financialProfile }: ManualPropertyEntryProps) {
  const [property, setProperty] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    price: 350000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1500,
    propertyType: "single-family",
    hoaMonthly: 0,
  });

  const handleSubmit = () => {
    const stateData = statesData.find(s => s.abbreviation === property.state);
    if (!stateData) return;

    const homePrice = property.price;
    const hoaMonthly = property.hoaMonthly;

    // Calculate for multiple down payment options
    const downPaymentOptions = [3.5, 5, 10, 20];
    const calculations: Record<string, any> = {};

    for (const dpPercent of downPaymentOptions) {
      const downPaymentAmount = homePrice * (dpPercent / 100);
      const loanAmount = homePrice - downPaymentAmount;
      
      const monthlyRate = stateData.avgMortgageRate / 100 / 12;
      const numPayments = 30 * 12;
      const monthlyMortgage = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
      
      const monthlyPropertyTax = (homePrice * (stateData.avgPropertyTax / 100)) / 12;
      const monthlyInsurance = (stateData.avgHomeInsurance * (homePrice / 100000)) / 12;
      const monthlyPMI = dpPercent < 20 ? (loanAmount * 0.005) / 12 : 0;
      const totalMonthlyPayment = monthlyMortgage + monthlyPropertyTax + monthlyInsurance + monthlyPMI + hoaMonthly;
      const closingCosts = homePrice * (stateData.avgClosingCost / 100);
      const cashToClose = downPaymentAmount + closingCosts;

      calculations[`${dpPercent}%`] = {
        downPaymentPercent: dpPercent,
        downPaymentAmount: Math.round(downPaymentAmount),
        loanAmount: Math.round(loanAmount),
        monthlyMortgage: Math.round(monthlyMortgage),
        monthlyPropertyTax: Math.round(monthlyPropertyTax),
        monthlyInsurance: Math.round(monthlyInsurance),
        monthlyPMI: Math.round(monthlyPMI),
        monthlyHOA: hoaMonthly,
        totalMonthlyPayment: Math.round(totalMonthlyPayment),
        closingCosts: Math.round(closingCosts),
        cashToClose: Math.round(cashToClose),
      };
    }

    let qualification = null;
    if (financialProfile) {
      const monthlyIncome = financialProfile.yearlyIncome / 12;
      const defaultCalc = calculations['20%'];
      const monthlyDebt = (financialProfile.totalDebt || 0);
      const dtiRatio = ((defaultCalc.totalMonthlyPayment + monthlyDebt) / monthlyIncome) * 100;
      
      const reservesNeeded = defaultCalc.totalMonthlyPayment * 3;
      const totalCashRequired = defaultCalc.cashToClose + reservesNeeded;
      const qualifies = dtiRatio <= 43 && financialProfile.savings >= totalCashRequired && financialProfile.creditScore >= 620;
      
      qualification = {
        qualifies,
        dtiRatio: Math.round(dtiRatio * 10) / 10,
        requiredIncome: Math.round((defaultCalc.totalMonthlyPayment / 0.28) * 12),
        requiredSavings: Math.round(totalCashRequired),
        creditScoreOk: financialProfile.creditScore >= 620,
        dtiOk: dtiRatio <= 43,
        savingsOk: financialProfile.savings >= totalCashRequired,
      };
    }

    onSubmit({
      property: {
        ...property,
        zipCode: property.zipCode,
      },
      calculations,
      qualification,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="w-5 h-5" />
          Manual Property Entry
        </CardTitle>
        <CardDescription>
          Enter property details manually for analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Street Address</Label>
            <AddressAutocomplete
              id="address"
              value={property.address}
              onChange={(v) => setProperty(prev => ({ ...prev, address: v }))}
              onSelect={(p) => setProperty(prev => ({
                ...prev,
                address: p.street || p.formattedAddress,
                city: p.city || prev.city,
                state: p.state || prev.state,
                zipCode: (p.zip || (prev as any).zipCode || (prev as any).zip) ?? (prev as any).zipCode,
              } as typeof prev))}
              placeholder="123 Main Street"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="City"
              value={property.city}
              onChange={(e) => setProperty(prev => ({ ...prev, city: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select
              value={property.state}
              onValueChange={(value) => setProperty(prev => ({ ...prev, state: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {statesData.map(state => (
                  <SelectItem key={state.abbreviation} value={state.abbreviation}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              placeholder="12345"
              value={property.zipCode}
              onChange={(e) => setProperty(prev => ({ ...prev, zipCode: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price">Listing Price</Label>
            <MoneyInput
              id="price"
              value={property.price}
              onChange={(raw) => setProperty(prev => ({ ...prev, price: Number(raw) || 0 }))}
              aria-label="Listing price"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="beds">Bedrooms</Label>
            <Input
              id="beds"
              type="number"
              value={property.bedrooms}
              onChange={(e) => setProperty(prev => ({ ...prev, bedrooms: Number(e.target.value) }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="baths">Bathrooms</Label>
            <Input
              id="baths"
              type="number"
              step="0.5"
              value={property.bathrooms}
              onChange={(e) => setProperty(prev => ({ ...prev, bathrooms: Number(e.target.value) }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sqft">Square Feet</Label>
            <Input
              id="sqft"
              type="number"
              value={property.squareFeet}
              onChange={(e) => setProperty(prev => ({ ...prev, squareFeet: Number(e.target.value) }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="hoa">Monthly HOA</Label>
            <MoneyInput
              id="hoa"
              value={property.hoaMonthly}
              onChange={(raw) => setProperty(prev => ({ ...prev, hoaMonthly: Number(raw) || 0 }))}
              aria-label="Monthly HOA"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Property Type</Label>
            <Select
              value={property.propertyType}
              onValueChange={(value) => setProperty(prev => ({ ...prev, propertyType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single-family">Single Family</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="multi-family">Multi-Family</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={!property.state || !property.price}
          className="w-full"
        >
          <Calculator className="w-4 h-4 mr-2" />
          Calculate Analysis
        </Button>
      </CardContent>
    </Card>
  );
}
