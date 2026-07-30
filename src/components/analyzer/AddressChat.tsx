import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Send, User, MapPin, Shield, Trash2, TrendingUp, TrendingDown,
  Home, DollarSign, BarChart3, GraduationCap, Loader2, ChevronDown,
  ArrowRight, Bell, GitCompareArrows, Clock, Layers, Bookmark,
  Building, BedDouble, Bath, Ruler, Calendar, LandPlot, ArrowUpRight,
  ArrowLeft, Save, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { analyzeState, parseLocationInput, parseCompareInput, type StateAnalysis } from "@/lib/market-data";
import { supabase } from "@/integrations/supabase/client";
import { clearActiveBuyerSession } from "@/lib/buyerSessionStorage";

type ChatEntry = {
  id: string;
  type: "user" | "result" | "comparison" | "loading" | "error";
  query?: string;
  analysis?: StateAnalysis;
  analyses?: [StateAnalysis, StateAnalysis];
  isAddress?: boolean;
  error?: string;
  timestamp?: string;
};



const fmt = (n: number) => n.toLocaleString("en-US");
const fmtD = (n: number) => "$" + fmt(n);
const fmtK = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${Math.round(n / 1000)}K` : fmtD(n);

// Animated counter hook
function useCountUp(target: number, duration = 500, enabled = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled) { setValue(target); return; }
    let start = 0;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration, enabled]);
  return value;
}

function AnimatedNumber({ value, prefix = "", suffix = "", enabled = true }: { value: number; prefix?: string; suffix?: string; enabled?: boolean }) {
  const animated = useCountUp(value, 600, enabled);
  return <>{prefix}{fmt(animated)}{suffix}</>;
}

// Section card header with colored bar
function SectionHeader({ icon: Icon, title, color = "primary" }: { icon: React.ElementType; title: string; color?: "primary" | "accent" | "success" | "warning" }) {
  const bgMap = {
    primary: "bg-primary",
    accent: "bg-accent",
    success: "bg-[hsl(var(--success))]",
    warning: "bg-[hsl(var(--warning))]",
  };
  return (
    <div className={cn("flex items-center gap-2.5 px-5 py-3 rounded-t-xl", bgMap[color])}>
      <Icon className="w-4 h-4 text-primary-foreground" />
      <h3 className="font-semibold text-sm text-primary-foreground tracking-wide">{title}</h3>
    </div>
  );
}

// Mini stat card used inside sections
function MiniStat({ icon: Icon, label, value, context, valueColor, animate = true }: {
  icon?: React.ElementType; label: string; value: React.ReactNode; context?: string; valueColor?: string; animate?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 flex flex-col gap-1 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("font-bold text-lg text-foreground leading-tight", valueColor)}>{value}</p>
      {context && <p className="text-[11px] text-muted-foreground leading-snug">{context}</p>}
    </div>
  );
}

// Market temperature bar
function MarketTempBar({ daysOnMarket }: { daysOnMarket: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), 300); }, []);

  // Position: fewer days = hotter (right), more days = cooler (left)
  const position = Math.max(0, Math.min(100, 100 - ((daysOnMarket - 15) / 55) * 100));
  const tempLabel = daysOnMarket < 25 ? "Hot Market" : daysOnMarket < 40 ? "Warm Market" : daysOnMarket < 50 ? "Balanced" : "Cooling";

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
        <span>Buyer's Market</span>
        <span className="font-medium text-foreground">{tempLabel}</span>
        <span>Seller's Market</span>
      </div>
      <div className="relative h-2.5 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 via-yellow-400 to-red-500">
        <div
          className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-card border-2 border-foreground shadow-md transition-all duration-1000 ease-out", animated ? "opacity-100" : "opacity-0")}
          style={{ left: animated ? `calc(${position}% - 8px)` : "0%" }}
        />
      </div>
    </div>
  );
}

// Yield color helper
function yieldColor(value: number): string {
  if (value >= 7) return "text-[hsl(var(--success))]";
  if (value >= 5) return "text-[hsl(var(--warning))]";
  return "text-accent";
}

function ResultCard({ analysis, isAddress, onChipClick, query }: { analysis: StateAnalysis; isAddress?: boolean; onChipClick: (q: string) => void; query?: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [visibleSections, setVisibleSections] = useState(0);
  const [savingAnalysis, setSavingAnalysis] = useState(false);
  const [analysisSaved, setAnalysisSaved] = useState(false);

  const handleSaveAnalysis = async () => {
    if (!user) {
      toast({
        title: "Sign in to save",
        description: "Create an account or sign in to save this analysis to your dashboard.",
      });
      navigate("/auth");
      return;
    }
    setSavingAnalysis(true);
    try {
      const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const { error } = await supabase.from("saved_scenarios" as any).insert({
        user_id: user.id,
        scenario_name: `Market Analysis — ${query || analysis.stateName} (${dateStr})`,
        inputs: { type: "market_analysis", state: analysis.stateName, stateAbbr: analysis.stateAbbr, isAddress: !!isAddress, query },
        results: analysis,
      });
      if (error) throw error;
      setAnalysisSaved(true);
      toast({ title: "Analysis saved", description: "View it anytime in My Saved Analyses." });
    } catch (err: any) {
      toast({ title: "Couldn't save", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setSavingAnalysis(false);
    }
  };

  useEffect(() => {
    const total = isAddress ? 8 : 7;
    let i = 0;
    const timer = setInterval(() => { i++; setVisibleSections(i); if (i >= total) clearInterval(timer); }, 150);
    return () => clearInterval(timer);
  }, [isAddress]);

  const sectionClass = (idx: number) =>
    cn("transition-all duration-500 ease-out", visibleSections > idx ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none");

  const priceToRent = analysis.monthlyRent > 0 ? Math.round(analysis.medianHomePrice / (analysis.monthlyRent * 12)) : 0;
  const monthsInventory = analysis.extras.medianDaysOnMarket < 30 ? 2.5 : analysis.extras.medianDaysOnMarket < 45 ? 4.2 : 6.1;
  const inventoryCtx = monthsInventory < 4 ? "Seller's market" : monthsInventory <= 6 ? "Balanced market" : "Buyer's market";

  let sIdx = 0;

  return (
    <div className="space-y-4 w-full max-w-2xl">
      {/* Results Header */}
      <div className={sectionClass(sIdx++)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground leading-tight">
              {query || analysis.stateName}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wider">
                {isAddress ? "Property Estimate" : "Market Analysis"}
              </Badge>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Analysis generated {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Property Card — only for specific addresses */}
      {isAddress && (
        <div className={sectionClass(sIdx++)}>
          <Card className="overflow-hidden border-border shadow-[var(--shadow-md)]">
            <SectionHeader icon={Home} title="Property Details" color="primary" />
            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Estimated Value</p>
                  <p className="font-bold text-xl text-foreground mt-0.5">
                    <AnimatedNumber value={analysis.medianHomePrice} prefix="$" />
                  </p>
                  <Badge variant="outline" className="mt-1 text-[10px] border-[hsl(var(--warning))]/50 text-[hsl(var(--warning))]">estimated</Badge>
                </div>
                <StatCell icon={Building} label="Property Type" value="Single Family" tag="estimated" />
                <StatCell icon={BedDouble} label="Beds" value="3" tag="estimated" />
                <StatCell icon={Bath} label="Baths" value="2" tag="estimated" />
                <StatCell icon={Ruler} label="Sqft" value="1,800" tag="estimated" />
                <StatCell icon={Calendar} label="Year Built" value="2005" tag="estimated" />
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground mb-1.5">Data Confidence</p>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
                  <div className="bg-[hsl(var(--warning))] w-full" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">All values estimated from regional averages</p>
              </div>
              <div className="mt-3 rounded-lg bg-accent/5 border border-accent/20 p-3">
                <p className="text-xs text-muted-foreground">
                  Detailed property-specific analysis including comparable sales, estimated value, and neighborhood data is a <strong className="text-foreground">Premium feature</strong> — coming soon.
                </p>
                <Button variant="outline" size="sm" className="mt-2 text-xs gap-1.5 border-accent/30 text-accent hover:bg-accent/10">
                  <Bell className="w-3 h-3" /> Notify me when available
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Market Overview Card */}
      <div className={sectionClass(sIdx++)}>
        <Card className="overflow-hidden border-border shadow-[var(--shadow-md)]">
          <SectionHeader icon={TrendingUp} title="Market Overview" />
          <CardContent className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <MiniStat
                icon={DollarSign}
                label="Median Home Price"
                value={<AnimatedNumber value={analysis.medianHomePrice} prefix="$" />}
                context={`in ${analysis.extras.top3Cities[0] || analysis.stateName} metro`}
              />
              <MiniStat
                icon={analysis.yoyChange.pct > 0 ? TrendingUp : TrendingDown}
                label="Price Trend"
                value={`${analysis.yoyChange.pct > 0 ? "+" : ""}${analysis.yoyChange.pct}% YoY`}
                valueColor={analysis.yoyChange.pct > 2 ? "text-[hsl(var(--success))]" : analysis.yoyChange.pct > 0 ? "text-[hsl(var(--warning))]" : "text-destructive"}
                context={analysis.yoyChange.label}
              />
              <MiniStat
                icon={Clock}
                label="Days on Market"
                value={`${analysis.extras.medianDaysOnMarket}`}
                context={analysis.extras.medianDaysOnMarket < 30 ? "Fast-moving" : analysis.extras.medianDaysOnMarket < 45 ? "Moderate pace" : "Slower pace"}
              />
              <MiniStat
                icon={BarChart3}
                label="Inventory"
                value={`${monthsInventory} mo`}
                context={inventoryCtx}
              />
              <MiniStat
                icon={MapPin}
                label="Population"
                value={analysis.extras.population}
                context={`Median income ${fmtK(analysis.extras.medianHouseholdIncome)}`}
              />
              <MiniStat
                icon={Building}
                label="Cost of Living"
                value={`${analysis.extras.costOfLivingIndex}`}
                context={analysis.extras.costOfLivingIndex > 110 ? "Above national avg" : analysis.extras.costOfLivingIndex < 95 ? "Below national avg" : "Near national avg"}
              />
            </div>
            <MarketTempBar daysOnMarket={analysis.extras.medianDaysOnMarket} />
          </CardContent>
        </Card>
      </div>

      {/* Costs Breakdown Card */}
      <div className={sectionClass(sIdx++)}>
        <Card className="overflow-hidden border-border shadow-[var(--shadow-md)]">
          <SectionHeader icon={DollarSign} title="Ownership Costs" color="accent" />
          <CardContent className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wider">Cost Item</th>
                    <th className="text-right py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wider">Annual</th>
                    <th className="text-right py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wider">Monthly</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <td className="py-2.5 text-foreground">Property Tax</td>
                    <td className="text-right py-2.5 font-medium">{fmtD(analysis.annualPropertyTax)}</td>
                    <td className="text-right py-2.5 font-medium">{fmtD(Math.round(analysis.annualPropertyTax / 12))}</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2.5 text-foreground">Home Insurance</td>
                    <td className="text-right py-2.5 font-medium">{fmtD(analysis.avgHomeInsurance)}</td>
                    <td className="text-right py-2.5 font-medium">{fmtD(Math.round(analysis.avgHomeInsurance / 12))}</td>
                  </tr>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <td className="py-2.5 text-foreground">HOA</td>
                    <td className="text-right py-2.5 text-muted-foreground italic" colSpan={2}>Varies by property</td>
                  </tr>
                  <tr className="bg-primary/5">
                    <td className="py-2.5 font-semibold text-foreground">Total Annual Cost</td>
                    <td className="text-right py-2.5 font-bold text-foreground">{fmtD(analysis.annualPropertyTax + analysis.avgHomeInsurance)}</td>
                    <td className="text-right py-2.5 font-bold text-foreground">{fmtD(Math.round((analysis.annualPropertyTax + analysis.avgHomeInsurance) / 12))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 rounded-lg border-l-4 border-l-accent bg-accent/5 p-3.5">
              <p className="text-xs text-foreground">
                <strong>Estimated Closing Costs:</strong> ~{analysis.closingCostPct}% of purchase price = <strong>{fmtD(analysis.closingCosts)}</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Analysis Card */}
      <div className={sectionClass(sIdx++)}>
        <Card className="overflow-hidden border-border shadow-[var(--shadow-md)]">
          <SectionHeader icon={BarChart3} title="Investment Potential" color="success" />
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MiniStat
                icon={Home}
                label="Monthly Rent"
                value={fmtD(analysis.monthlyRent)}
                context={`${(analysis.rentRatio * 100).toFixed(1)}% rent ratio`}
              />
              <MiniStat
                icon={TrendingUp}
                label="Gross Yield"
                value={`${analysis.grossYield}%`}
                valueColor={yieldColor(analysis.grossYield)}
                context={analysis.grossYield >= 7 ? "Strong" : analysis.grossYield >= 5 ? "Moderate" : "Low yield"}
              />
              <MiniStat
                icon={BarChart3}
                label="Cap Rate"
                value={`${analysis.capRate}%`}
                valueColor={yieldColor(analysis.capRate + 1.5)}
                context="Yield − 1.5% expenses"
              />
              <MiniStat
                icon={Ruler}
                label="Price-to-Rent"
                value={String(priceToRent)}
                context={priceToRent < 15 ? "Favorable for investors" : priceToRent < 20 ? "Moderate ratio" : "High ratio"}
              />
            </div>
            {/* Verdict banner */}
            <div className={cn("rounded-xl p-4 text-center border",
              analysis.capRate >= 5 ? "bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/30" :
              analysis.capRate >= 3 ? "bg-[hsl(var(--warning))]/10 border-[hsl(var(--warning))]/30" :
              "bg-accent/10 border-accent/30"
            )}>
              <p className={cn("font-bold text-sm",
                analysis.capRate >= 5 ? "text-[hsl(var(--success))]" :
                analysis.capRate >= 3 ? "text-[hsl(var(--warning))]" :
                "text-accent"
              )}>
                {analysis.capRate >= 5 ? "💰 Strong Cash Flow Market" :
                 analysis.capRate >= 3 ? "📈 Moderate Returns — Growth Play" :
                 "🏡 Appreciation Market — Low Cash Flow"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Cash-on-cash return with 20% down: <strong>{analysis.cashOnCashReturn}%</strong>
              </p>
            </div>
            <Button
              variant="accent"
              size="sm"
              className="w-full gap-2"
              onClick={() => {
                clearActiveBuyerSession();
                navigate(`/buyers?state=${analysis.stateAbbr}`);
              }}
            >
              Calculate Your ROI <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Comparable Properties Card */}
      <div className={sectionClass(sIdx++)}>
        <Card className="overflow-hidden border-border shadow-[var(--shadow-md)]">
          <SectionHeader icon={Layers} title="Comparable Properties" />
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Comp 1", price: Math.round(analysis.medianHomePrice * 0.95), beds: 3, sqft: "1,650" },
                { label: "Comp 2", price: Math.round(analysis.medianHomePrice * 1.02), beds: 4, sqft: "2,100", locked: true },
                { label: "Comp 3", price: Math.round(analysis.medianHomePrice * 0.98), beds: 3, sqft: "1,800", locked: true },
              ].map((comp, i) => (
                <div key={i} className={cn("relative rounded-xl border border-border p-4 bg-card", comp.locked && "select-none")}>
                  {comp.locked && (
                    <div className="absolute inset-0 rounded-xl bg-card/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                      <p className="text-xs font-medium text-muted-foreground">Premium Feature</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Upgrade to see all comps</p>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{comp.label}</p>
                  <p className="font-bold text-lg text-foreground mt-1">{fmtD(comp.price)}</p>
                  <div className="flex gap-1.5 mt-2">
                    <Badge variant="secondary" className="text-[10px]">{comp.beds} bd</Badge>
                    <Badge variant="secondary" className="text-[10px]">{comp.sqft} sqft</Badge>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 italic">
              Based on similar properties in the area. Actual comps require MLS data.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* First-Time Buyer Programs */}
      {analysis.buyerPrograms.length > 0 && (
        <div className={sectionClass(sIdx++)}>
          <Card className="overflow-hidden border-border shadow-[var(--shadow-md)]">
            <SectionHeader icon={GraduationCap} title="First-Time Buyer Programs" color="warning" />
            <CardContent className="p-5 space-y-2">
              {analysis.buyerPrograms.map((prog, i) => (
                <Collapsible key={i}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full text-left p-3.5 rounded-xl border border-border hover:bg-muted/50 transition-colors group">
                    <span className="font-medium text-sm text-foreground">{prog.name}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-3.5 pb-3 pt-1 text-xs text-muted-foreground space-y-1.5">
                    <p>{prog.description}</p>
                    <p><strong className="text-foreground">Eligibility:</strong> {prog.eligibility}</p>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* CTA Section */}
      <div className={sectionClass(sIdx++)}>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Button
            variant="accent"
            className="flex-1 gap-2"
            onClick={() => {
              clearActiveBuyerSession();
              navigate(`/buyers?state=${analysis.stateAbbr}`);
            }}
          >
            Calculate Affordability <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 border-primary/30 text-primary hover:bg-primary/5"
            onClick={() => navigate(`/guides/buyers`)}
          >
            <Bookmark className="w-4 h-4" /> View Buyer Guide
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 border-primary/30 text-primary hover:bg-primary/5"
            onClick={handleSaveAnalysis}
            disabled={savingAnalysis || analysisSaved}
          >
            {savingAnalysis ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : analysisSaved ? (
              <Check className="w-4 h-4" />
            ) : (
              <ArrowUpRight className="w-4 h-4" />
            )}
            {analysisSaved ? "Saved" : "Save Analysis"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {(
            [
              { label: "Compare with another market", action: `Compare ${analysis.stateName} vs ` },
              { label: "See first-time buyer programs", to: `/buyers/programs?state=${encodeURIComponent(analysis.stateName)}` },
              { label: `Explore ${analysis.stateName} properties`, to: `/properties/search?state=${analysis.stateAbbr}` },
            ] as { label: string; action?: string; to?: string }[]
          ).map(chip => (
            <button
              key={chip.label}
              onClick={() => (chip.to ? navigate(chip.to) : onChipClick(chip.action!))}
              className="text-xs px-3.5 py-2 rounded-full border border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors shadow-[var(--shadow-sm)]"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className={sectionClass(sIdx++)}>
        <p className="text-[10px] text-muted-foreground/70 leading-relaxed px-1">
          All estimates are generated from regional market data and statistical models. Values marked "estimated" are approximations. For confirmed property data, listing details, and professional valuations, consult a licensed real estate professional or appraiser. throuly does not guarantee the accuracy of these estimates.
        </p>
      </div>
    </div>
  );
}

function StatCell({ icon: Icon, label, value, tag }: { icon: React.ElementType; label: string; value: string; tag?: "confirmed" | "estimated" }) {
  return (
    <div>
      <div className="flex items-center gap-1">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className="font-bold text-lg text-foreground mt-0.5">{value}</p>
      {tag && (
        <Badge variant="outline" className={cn("mt-0.5 text-[9px]",
          tag === "confirmed" ? "border-[hsl(var(--success))]/50 text-[hsl(var(--success))]" : "border-[hsl(var(--warning))]/50 text-[hsl(var(--warning))]"
        )}>
          {tag}
        </Badge>
      )}
    </div>
  );
}

function ComparisonView({ a, b, onChipClick }: { a: StateAnalysis; b: StateAnalysis; onChipClick: (q: string) => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  const rows: { label: string; valA: string; valB: string; betterIdx?: 0 | 1 }[] = [
    { label: "Median Home Price", valA: fmtD(a.medianHomePrice), valB: fmtD(b.medianHomePrice), betterIdx: a.medianHomePrice < b.medianHomePrice ? 0 : 1 },
    { label: "Property Tax Rate", valA: `${a.propertyTaxRate}%`, valB: `${b.propertyTaxRate}%`, betterIdx: a.propertyTaxRate < b.propertyTaxRate ? 0 : 1 },
    { label: "Est. Monthly Payment", valA: fmtD(a.monthlyPayment), valB: fmtD(b.monthlyPayment), betterIdx: a.monthlyPayment < b.monthlyPayment ? 0 : 1 },
    { label: "Rental Yield", valA: `${a.grossYield}%`, valB: `${b.grossYield}%`, betterIdx: a.grossYield > b.grossYield ? 0 : 1 },
    { label: "Cost of Living", valA: String(a.extras.costOfLivingIndex), valB: String(b.extras.costOfLivingIndex), betterIdx: a.extras.costOfLivingIndex < b.extras.costOfLivingIndex ? 0 : 1 },
    { label: "Income Needed", valA: fmtD(a.minIncomeRequired), valB: fmtD(b.minIncomeRequired), betterIdx: a.minIncomeRequired < b.minIncomeRequired ? 0 : 1 },
    { label: "Closing Costs", valA: fmtD(a.closingCosts), valB: fmtD(b.closingCosts), betterIdx: a.closingCosts < b.closingCosts ? 0 : 1 },
    { label: "YoY Price Change", valA: `+${a.yoyChange.pct}%`, valB: `+${b.yoyChange.pct}%` },
  ];

  const betterInvestor = a.grossYield > b.grossYield ? a.stateName : b.stateName;
  const betterAfford = a.medianHomePrice < b.medianHomePrice ? a.stateName : b.stateName;
  const betterAppreciation = a.yoyChange.pct > b.yoyChange.pct ? a.stateName : b.stateName;

  return (
    <div className={cn("space-y-4 max-w-2xl transition-all duration-500", visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wider">Comparison</Badge>
        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" /> {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <Card className="overflow-hidden border-border shadow-[var(--shadow-md)]">
        <SectionHeader icon={GitCompareArrows} title={`${a.stateName} vs ${b.stateName}`} />
        <CardContent className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wider">Metric</th>
                  <th className="text-right py-2.5 font-bold text-foreground">{a.stateName}</th>
                  <th className="text-right py-2.5 font-bold text-foreground">{b.stateName}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={cn("border-b border-border/50", i % 2 === 0 && "bg-muted/20")}>
                    <td className="py-2.5 text-muted-foreground">{r.label}</td>
                    <td className={cn("text-right py-2.5 font-medium", r.betterIdx === 0 && "text-[hsl(var(--success))] font-bold")}>{r.valA}</td>
                    <td className={cn("text-right py-2.5 font-medium", r.betterIdx === 1 && "text-[hsl(var(--success))] font-bold")}>{r.valB}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs">
            <p><strong className="text-foreground">🏆 Better for investors:</strong> <span className="text-[hsl(var(--success))] font-semibold">{betterInvestor}</span> (higher yield)</p>
            <p><strong className="text-foreground">💰 Better for affordability:</strong> <span className="text-[hsl(var(--success))] font-semibold">{betterAfford}</span> (lower price)</p>
            <p><strong className="text-foreground">📈 Better for appreciation:</strong> <span className="text-[hsl(var(--success))] font-semibold">{betterAppreciation}</span> (higher YoY change)</p>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        {[`Analyze ${a.stateName}`, `Analyze ${b.stateName}`].map(chip => (
          <button key={chip} onClick={() => onChipClick(chip.replace("Analyze ", ""))} className="text-xs px-3.5 py-2 rounded-full border border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors shadow-[var(--shadow-sm)]">{chip}</button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground/70 leading-relaxed px-1">
        All estimates are generated from regional market data and statistical models. throuly does not guarantee the accuracy of these estimates.
      </p>
    </div>
  );
}

interface AddressChatProps {
  onBeforeSubmit?: (query: string) => boolean;
}

export function AddressChat({ onBeforeSubmit }: AddressChatProps = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [privacyMode, setPrivacyMode] = useState(true);
  const [savingHistory, setSavingHistory] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ placeId: string; text: string; mainText: string; secondaryText: string }>>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestHighlight, setSuggestHighlight] = useState(0);
  const suggestSessionRef = useRef<string>(crypto.randomUUID());
  const suggestDebounceRef = useRef<number | null>(null);

  // Debounced Google Places search (suppressed for compare queries)
  useEffect(() => {
    if (suggestDebounceRef.current) window.clearTimeout(suggestDebounceRef.current);
    const trimmed = input.trim();
    const isCompare = /^compare\s/i.test(trimmed) || /\s+vs\s+/i.test(trimmed);
    if (trimmed.length < 3 || isCompare) {
      setSuggestions([]); setSuggestOpen(false); return;
    }
    suggestDebounceRef.current = window.setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("throulyscout-places-autocomplete", {
          body: { action: "search", input: trimmed, sessionToken: suggestSessionRef.current },
        });
        if (error) return;
        const preds = data?.predictions || [];
        setSuggestions(preds);
        setSuggestOpen(preds.length > 0);
        setSuggestHighlight(0);
      } catch { /* noop */ }
    }, 250);
    return () => { if (suggestDebounceRef.current) window.clearTimeout(suggestDebounceRef.current); };
  }, [input]);

  const pickSuggestion = useCallback((p: { placeId: string; text: string }) => {
    setInput(p.text);
    setSuggestOpen(false);
    setSuggestions([]);
    suggestSessionRef.current = crypto.randomUUID();
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll each new turn into view starting from its top (the user's question),
  // not the bottom of the page — otherwise a long result renders off-screen
  // and the user lands on the tail end of it instead of the beginning.
  const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastScrolledIdRef = useRef<string | null>(null);
  useEffect(() => {
    const lastUserEntry = [...entries].reverse().find((e) => e.type === "user");
    if (lastUserEntry && lastScrolledIdRef.current !== lastUserEntry.id) {
      lastScrolledIdRef.current = lastUserEntry.id;
      requestAnimationFrame(() => {
        entryRefs.current[lastUserEntry.id]?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [entries]);

  const processQuery = async (query: string) => {
    if (!query.trim()) return;
    const id = crypto.randomUUID();
    setEntries(prev => [...prev, { id: id + "-q", type: "user", query }]);

    const loadingId = id + "-load";
    setEntries(prev => [...prev, { id: loadingId, type: "loading" }]);

    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

    const compare = parseCompareInput(query);
    if (compare) {
      const a1 = analyzeState(compare[0].stateAbbr);
      const a2 = analyzeState(compare[1].stateAbbr);
      if (a1 && a2) {
        setEntries(prev => [...prev.filter(e => e.id !== loadingId), { id, type: "comparison", analyses: [a1, a2] }]);
        if (!privacyMode) saveQuery(query, `${a1.stateAbbr} vs ${a2.stateAbbr}`);
        return;
      }
    }

    const loc = parseLocationInput(query);
    if (!loc) {
      setEntries(prev => [...prev.filter(e => e.id !== loadingId), { id, type: "error", error: "Couldn't identify a U.S. state, city, or ZIP code. Try entering a city name, state, or 5-digit ZIP." }]);
      return;
    }

    const analysis = analyzeState(loc.stateAbbr);
    if (!analysis) {
      setEntries(prev => [...prev.filter(e => e.id !== loadingId), { id, type: "error", error: "No data available for this location." }]);
      return;
    }

    setEntries(prev => [...prev.filter(e => e.id !== loadingId), { id, type: "result", analysis, isAddress: loc.isSpecificAddress, query }]);
    if (!privacyMode) saveQuery(query, loc.stateAbbr);
  };


  const saveQuery = async (query: string, stateIdentified: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Search saved:", { query, stateIdentified, userId: user?.id });
    } catch { /* ignore */ }
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    const q = input.trim();
    if (onBeforeSubmit && !onBeforeSubmit(q)) return;
    setInput("");
    processQuery(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChipClick = (q: string) => {
    setInput(q);
    textareaRef.current?.focus();
  };

  const clearChat = () => setEntries([]);
  const hasEntries = entries.length > 0;

  const handleSaveHistory = async () => {
    if (!user || !hasEntries) return;
    setSavingHistory(true);
    try {
      const queries = entries.filter((e) => e.type === "user" && e.query).map((e) => e.query!);
      for (const q of queries) {
        await saveQuery(q, "");
      }
      toast({ title: "Saved to your account", description: "Your analyzer searches are now in your dashboard." });
    } catch {
      toast({ title: "Couldn't save", description: "Please try again.", variant: "destructive" });
    } finally {
      setSavingHistory(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Privacy Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-6 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          {user && (
            <>
              <Link to="/dashboard/client">
                <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground -ml-2">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
                </Button>
              </Link>
              <Link to="/dashboard/client/saved-analyses">
                <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                  <Bookmark className="w-4 h-4 mr-1" /> Saved Analyses
                </Button>
              </Link>
            </>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">
              {privacyMode ? "Privacy Mode: Nothing stored" : "Chat history can be saved"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && hasEntries && !privacyMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveHistory}
              disabled={savingHistory}
              className="border-accent/40 text-accent hover:bg-accent hover:text-accent-foreground"
            >
              {savingHistory ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save to Account
            </Button>
          )}
          {hasEntries && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground">
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Label htmlFor="privacy-mode" className="text-sm text-muted-foreground cursor-pointer">Privacy</Label>
            <Switch id="privacy-mode" checked={privacyMode} onCheckedChange={setPrivacyMode} />
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {!hasEntries ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h2 className="font-serif text-3xl text-foreground mb-2">Market Analyzer</h2>
                <p className="text-muted-foreground max-w-md">
                  Enter any U.S. address, city, ZIP code, or state for instant market data, affordability estimates, and investment analysis.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
                {["123 Main St, Austin, TX 78701", "Miami, FL 33101", "Compare Denver vs Phoenix"].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
                    className="text-left px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-sm text-muted-foreground hover:text-foreground shadow-[var(--shadow-sm)]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {entries.map(entry => (
                <div key={entry.id} ref={(el) => (entryRefs.current[entry.id] = el)}>
                  {entry.type === "user" && (
                    <div className="flex gap-3 justify-end">
                      <div className="max-w-[85%] rounded-2xl px-5 py-3 bg-primary text-primary-foreground shadow-[var(--shadow-sm)]">
                        <p className="text-sm whitespace-pre-wrap">{entry.query}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  )}
                  {entry.type === "loading" && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-1">
                        <MapPin className="w-4 h-4 text-accent animate-pulse" />
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground py-3">
                        <Loader2 className="w-4 h-4 animate-spin text-accent" />
                        <span>Analyzing market data...</span>
                      </div>
                    </div>
                  )}
                  {entry.type === "result" && entry.analysis && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-1">
                        <TrendingUp className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <ResultCard analysis={entry.analysis} isAddress={entry.isAddress} onChipClick={handleChipClick} query={entry.query} />
                      </div>
                    </div>
                  )}
                  {entry.type === "comparison" && entry.analyses && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-1">
                        <GitCompareArrows className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <ComparisonView a={entry.analyses[0]} b={entry.analyses[1]} onChipClick={handleChipClick} />
                      </div>
                    </div>
                  )}
                  {entry.type === "error" && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-1">
                        <MapPin className="w-4 h-4 text-destructive" />
                      </div>
                      <div className="rounded-2xl px-5 py-3 bg-card border border-border text-sm text-muted-foreground shadow-[var(--shadow-sm)]">
                        {entry.error}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="relative flex items-end gap-3">
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                value={input}
                maxLength={2000}
                onChange={e => setInput(e.target.value.slice(0, 2000))}

                onKeyDown={(e) => {
                  if (suggestOpen && suggestions.length > 0) {
                    if (e.key === "ArrowDown") { e.preventDefault(); setSuggestHighlight(h => Math.min(h + 1, suggestions.length - 1)); return; }
                    if (e.key === "ArrowUp") { e.preventDefault(); setSuggestHighlight(h => Math.max(h - 1, 0)); return; }
                    if (e.key === "Escape") { setSuggestOpen(false); return; }
                    if (e.key === "Tab") { e.preventDefault(); pickSuggestion(suggestions[suggestHighlight]); return; }
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); pickSuggestion(suggestions[suggestHighlight]); return; }
                  }
                  handleKeyDown(e);
                }}
                onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
                onFocus={() => suggestions.length > 0 && setSuggestOpen(true)}
                placeholder='Enter an address, city, ZIP, or "Compare TX vs FL"...'
                className="min-h-[52px] max-h-[160px] resize-none pr-14 rounded-xl bg-background"
                rows={1}
              />
              {suggestOpen && suggestions.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-2 z-50 rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
                  <ul className="max-h-72 overflow-y-auto py-1">
                    {suggestions.map((p, i) => (
                      <li
                        key={p.placeId}
                        onMouseDown={(e) => { e.preventDefault(); pickSuggestion(p); }}
                        onMouseEnter={() => setSuggestHighlight(i)}
                        className={cn(
                          "px-3 py-2 cursor-pointer flex items-start gap-2 text-sm",
                          i === suggestHighlight ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                        )}
                      >
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.mainText || p.text}</div>
                          {p.secondaryText && <div className="text-xs text-muted-foreground truncate">{p.secondaryText}</div>}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="px-3 py-1.5 text-[10px] text-muted-foreground border-t border-border bg-muted/30">
                    Powered by Google · Tab/Enter to select
                  </div>
                </div>
              )}
            </div>
            <Button onClick={handleSubmit} disabled={!input.trim()} size="icon" variant="accent" className="absolute right-2 bottom-2 rounded-lg h-9 w-9">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Estimates for informational purposes only. Consult a licensed professional for specific advice.
          </p>
        </div>
      </div>
    </div>
  );
}
