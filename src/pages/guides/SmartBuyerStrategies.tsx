import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  AlertTriangle,
  Lock,
  ImageOff,
  Calculator,
  Building2,
  Home,
  Repeat,
  ShieldCheck,
  Loader2,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface Strategy {
  id: string;
  icon: React.ElementType;
  title: string;
  summary: string;
  points: string[];
  ctaLabel: string;
  ctaHref: string;
}

const STRATEGIES: Strategy[] = [
  {
    id: "fha-again",
    icon: Repeat,
    title: "Using an FHA loan more than once",
    summary:
      "FHA is not a one-and-done program. You can use it again in your lifetime — the key is understanding when a second FHA loan is allowed.",
    points: [
      "Sequential use: Pay off (or refinance out of) your existing FHA loan, and you can qualify for another FHA loan on your next primary residence.",
      "Refinancing out of FHA: Once you have ~20% equity, refinancing into a conventional loan drops mortgage insurance and frees up your FHA eligibility for a future purchase.",
      "Two FHA loans at once — official exceptions: a documented job relocation of 100+ miles, a legitimate increase in family size that outgrows the current home, vacating a jointly-owned home after divorce, or a non-occupying co-borrower buying their own primary residence.",
      "Every FHA loan requires that you occupy the property as your primary residence for at least 12 months.",
    ],
    ctaLabel: "Model an FHA re-use scenario",
    ctaHref:
      "/buyers?strategy=fha-again&loanType=fha&propertyType=single-family&price=350000",
  },
  {
    id: "house-hack",
    icon: Building2,
    title: "House hacking a 2–4 unit with FHA",
    summary:
      "FHA lets you buy a duplex, triplex, or fourplex with as little as 3.5% down — as long as you occupy one of the units.",
    points: [
      "You must move into one unit within 60 days of closing and live there for at least 12 months.",
      "The other units can be rented out. A portion of that projected rent (self-sufficiency test for 3–4 units) can help you qualify.",
      "Multi-family FHA loans have higher loan limits than single-family in the same county — often significantly higher.",
      "Reserves and appraisal standards are stricter on 3–4 unit properties; budget for a larger inspection and higher closing costs.",
    ],
    ctaLabel: "Model a duplex house hack",
    ctaHref:
      "/buyers?strategy=house-hack&loanType=fha&propertyType=multi-family&price=550000",
  },
  {
    id: "starter-condo",
    icon: Home,
    title: "The starter-condo path",
    summary:
      "A low-down-payment condo can be a legitimate stepping stone — provided you meet occupancy rules and only rent it out after the required period.",
    points: [
      "Buy an FHA- or conventional-approved condo with 3–5% down as your primary residence.",
      "Occupy for at least 12 months (FHA) or per your loan's occupancy clause. Lying on the application is loan fraud, not a strategy.",
      "After the occupancy period, you may convert it to a rental and buy a new primary residence — the previous mortgage stays in your name and is counted against your DTI unless you can offset with a documented lease.",
      "Check whether the condo association allows rentals and any rental caps before you buy — an HOA rental ban can trap the strategy.",
    ],
    ctaLabel: "Model a starter condo",
    ctaHref:
      "/buyers?strategy=starter-condo&loanType=fha&propertyType=condo-coop&price=275000",
  },
  {
    id: "occupancy",
    icon: ShieldCheck,
    title: "Occupancy rules, in plain English",
    summary:
      "Owner-occupied loans are cheaper because the lender is taking less risk. That price break comes with promises you actually have to keep.",
    points: [
      "Primary residence = you live there. Most owner-occupied loans require move-in within 60 days and 12 months of continuous occupancy.",
      "Second home = personal use, typically a reasonable distance from your primary, not rented out full-time.",
      "Investment property = not owner-occupied. Higher down payment (usually 15–25%), higher rates, stricter reserves.",
      "Occupancy misrepresentation is federal loan fraud. Life changes (job relocation, family size, divorce) are legitimate; a plan to never live there is not.",
    ],
    ctaLabel: "Compare owner-occupied vs. investment scenarios",
    ctaHref:
      "/buyers?strategy=occupancy&loanType=conventional&propertyType=single-family",
  },
];

const suggestionSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(3, "Topic is too short")
    .max(200, "Topic must be under 200 characters"),
  note: z
    .string()
    .trim()
    .max(1000, "Details must be under 1000 characters")
    .optional()
    .or(z.literal("")),
});

function TeaserCard() {
  return (
    <Card className="p-8 md:p-12 text-center border-dashed">
      <Lock className="w-10 h-10 mx-auto mb-4 text-accent" />
      <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-3">
        Sign in to unlock advanced buyer strategies
      </h2>
      <p className="text-muted-foreground max-w-xl mx-auto mb-6">
        Free account required. Read AI-informed, fully compliant playbooks on FHA re-use, house hacking with a
        2–4 unit, the starter-condo path, and how occupancy rules actually work.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/auth">
          <Button size="lg">Sign in / Create account</Button>
        </Link>
        <Link to="/resources">
          <Button size="lg" variant="outline">
            Back to Resources
          </Button>
        </Link>
      </div>
    </Card>
  );
}

interface Suggestion {
  id: string;
  topic: string;
  note: string | null;
  created_at: string;
}

function SuggestForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mine, setMine] = useState<Suggestion[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("strategy_suggestions" as any)
      .select("id, topic, note, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setMine(data as unknown as Suggestion[]);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = suggestionSchema.safeParse({ topic, note });
    if (!parsed.success) {
      toast({
        title: "Check your entry",
        description: parsed.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("strategy_suggestions" as any).insert({
      user_id: user.id,
      topic: parsed.data.topic,
      note: parsed.data.note || null,
    });
    setSubmitting(false);
    if (error) {
      toast({
        title: "Couldn't submit",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Thanks — we got it", description: "We review suggestions weekly." });
    setTopic("");
    setNote("");
    void load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("strategy_suggestions" as any).delete().eq("id", id);
    if (!error) setMine((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <Card className="p-6 md:p-8">
      <h2 className="font-serif text-2xl text-foreground mb-2">Suggest a strategy</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Text-only — no attachments. Tell us what you'd like us to cover next.
      </p>

      <div className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2 mb-5 text-xs text-muted-foreground">
        <ImageOff className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Pictures and file attachments are not permitted on this page.</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="suggest-topic">Topic</Label>
          <Input
            id="suggest-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Assumable VA loans"
            maxLength={200}
            required
          />
        </div>
        <div>
          <Label htmlFor="suggest-note">Details (optional)</Label>
          <Textarea
            id="suggest-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What angle would be most useful?"
            maxLength={1000}
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-1">{note.length} / 1000</p>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Submit suggestion
        </Button>
      </form>

      {mine.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-foreground mb-3">Your suggestions</h3>
          <ul className="space-y-2">
            {mine.map((s) => (
              <li
                key={s.id}
                className="flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{s.topic}</p>
                  {s.note && <p className="text-xs text-muted-foreground line-clamp-2">{s.note}</p>}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={() => handleDelete(s.id)}
                  aria-label={`Delete suggestion ${s.topic}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

const SmartBuyerStrategies = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Smart Buyer Strategies | Throuly Resources"
        description="Advanced, fully compliant home-buying playbooks: FHA re-use, house hacking a 2–4 unit, the starter-condo path, and occupancy rules explained."
        path="/guides/smart-buyer-strategies"
        ogType="article"
        noindex
      />
      <Navbar />

      <main className="pt-24 pb-16">
        <article className="container mx-auto px-4 max-w-3xl">
          <Link
            to="/resources"
            className="inline-flex items-center text-muted-foreground hover:text-accent mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </Link>

          <header className="mb-8">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">For Buyers</Badge>
            <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              Smart Buyer Strategies
            </h1>
            <p className="text-lg text-muted-foreground">
              Advanced, fully compliant paths for repeat FHA use, house hacking, starter condos, and how
              occupancy rules actually work.
            </p>
          </header>

          {/* Persistent disclaimer */}
          <Card className="p-4 mb-6 border-warning/40 bg-warning/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/90">
                This content is for educational purposes only and is not financial, legal, or lending advice.
                Always follow occupancy and eligibility rules on your loan application. Consult a licensed loan
                officer for your situation.
              </p>
            </div>
          </Card>

          {/* No-image notice */}
          <div className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2 mb-8 text-xs text-muted-foreground">
            <ImageOff className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Image uploads and attachments are disabled on this page. All content is text-only by design.
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : !user ? (
            <TeaserCard />
          ) : (
            <>
              <div className="space-y-8">
                {STRATEGIES.map((s) => {
                  const Icon = s.icon;
                  return (
                    <Card key={s.id} id={s.id} className="p-6 md:p-8">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <h2 className="font-serif text-2xl text-foreground">{s.title}</h2>
                          <p className="text-sm text-muted-foreground mt-1">{s.summary}</p>
                        </div>
                      </div>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/90 marker:text-accent mb-6">
                        {s.points.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                      <Button onClick={() => navigate(s.ctaHref)} className="w-full sm:w-auto">
                        <Calculator className="w-4 h-4 mr-2" />
                        {s.ctaLabel}
                      </Button>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-12">
                <SuggestForm />
              </div>
            </>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default SmartBuyerStrategies;
