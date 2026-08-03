import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteMap } from "@/components/guide/SiteMap";
import { HowItWorksMetrics } from "@/components/how-it-works/HowItWorksMetrics";
import { TOUR_STORAGE_KEY } from "@/components/onboarding/GuidedTour";
import { clearActiveBuyerSession } from "@/lib/buyerSessionStorage";
import { Sparkles, Shield, MapPin, DollarSign, BarChart3, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "getting-started", label: "Getting started", icon: Sparkles },
  { id: "financial-info", label: "Entering your financial info", icon: DollarSign },
  { id: "results", label: "Understanding your results", icon: BarChart3 },
  { id: "compare", label: "Comparing across states", icon: MapPin },
  { id: "privacy", label: "Your privacy", icon: Shield },
  { id: "sitemap", label: "Site map", icon: Compass },
  { id: "tour", label: "Take the tour again", icon: Sparkles },
];

function Term({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>;
}

export default function HowItWorks() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveId(s.id);
          });
        },
        { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
      );
      io.observe(el);
      observers.push(io);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const restartTour = () => {
    if (typeof window !== "undefined") window.localStorage.removeItem(TOUR_STORAGE_KEY);
    clearActiveBuyerSession();
    navigate("/buyers?tour=1");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="How throuly scout works — a friendly guide for first-time buyers"
        description="Plain-English guide to using throuly scout: enter your financials, pick your state, understand your affordability results, and compare across states — with your data kept private."
        path="/how-it-works"
      />
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <header className="mb-10">
            <p className="text-sm font-medium text-accent mb-2">A friendly guide</p>
            <h1 className="font-serif text-3xl md:text-5xl text-foreground mb-4">
              How throuly scout works
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
              A calm, private way to figure out what home you can afford — no spam calls, no
              data brokers, and no jargon. Here's how each part fits together.
            </p>
          </header>

          <div className="grid gap-10 md:grid-cols-[220px_1fr]">
            {/* Sticky TOC */}
            <aside className="md:sticky md:top-24 md:self-start">
              <nav
                aria-label="Guide contents"
                className="rounded-2xl border border-border bg-card/40 p-3"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1">
                  On this page
                </p>
                <ul className="space-y-0.5 mt-1">
                  {SECTIONS.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className={cn(
                          "flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors",
                          activeId === s.id
                            ? "bg-accent/10 text-accent font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                        )}
                      >
                        <s.icon className="w-3.5 h-3.5" />
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Content */}
            <article className="space-y-14 max-w-3xl">
              <section id="getting-started" className="scroll-mt-24">
                <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
                  Getting started
                </h2>
                <div className="space-y-3 text-foreground/90 leading-relaxed">
                  <p>
                    Head to the{" "}
                    <Link to="/buyers" onClick={clearActiveBuyerSession} className="text-accent underline">
                      Calculator
                    </Link>{" "}
                    and answer a few questions about your income, monthly debts, savings, and credit
                    range. You'll pick the state you're buying in so the numbers reflect real local
                    taxes, insurance, and interest rates. It takes about 3 minutes and no account is
                    required to see your estimate.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    New here? A first-run tour will highlight each step for you. You can restart it
                    anytime from the bottom of this page or from{" "}
                    <Link to="/settings/account" className="underline">
                      Account Settings
                    </Link>
                    .
                  </p>
                </div>
              </section>

              <HowItWorksMetrics />

              <section id="financial-info" className="scroll-mt-24">
                <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">

                  Entering your financial info
                </h2>
                <div className="space-y-4 text-foreground/90 leading-relaxed">
                  <p>Here's what each field means, in plain English:</p>
                  <ul className="space-y-3">
                    <li>
                      <Term>Yearly income</Term> — Your total before-tax pay for the year (salary,
                      hourly, self-employment). Lenders use this to size your monthly payment.
                    </li>
                    <li>
                      <Term>Monthly debt payments</Term> — What you already pay each month toward
                      credit cards, car notes, student loans, and similar. This is the "D" in{" "}
                      <Term>DTI</Term>.
                    </li>
                    <li>
                      <Term>DTI (debt-to-income)</Term> — The share of your gross monthly income
                      that goes to debts plus your future mortgage payment. Lenders generally like
                      to see this below about 43%; some allow more with strong credit.
                    </li>
                    <li>
                      <Term>Available savings</Term> — Cash on hand for a down payment and closing
                      costs. This doesn't have to include retirement accounts.
                    </li>
                    <li>
                      <Term>Down payment</Term> — The chunk of the home's price you pay upfront.
                      Most loans allow 3%–5% down; 20% down avoids monthly mortgage insurance.
                    </li>
                    <li>
                      <Term>Credit range</Term> — A rough band (e.g., 700–739). Higher scores usually
                      qualify for lower interest rates.
                    </li>
                  </ul>
                  <p>
                    Every field has a small{" "}
                    <span className="inline-flex items-center justify-center rounded-full border border-border w-5 h-5 text-[10px]">
                      ?
                    </span>{" "}
                    icon you can hover or tap for a quick reminder.
                  </p>
                </div>
              </section>

              <section id="results" className="scroll-mt-24">
                <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
                  Understanding your results
                </h2>
                <div className="space-y-4 text-foreground/90 leading-relaxed">
                  <p>
                    Your results page shows the <Term>Maximum you may qualify for</Term> and a{" "}
                    <Term>Compare Home Prices</Term> grid. Each price card is tagged one of three
                    ways:
                  </p>
                  <ul className="space-y-2">
                    <li>
                      <Term>Qualified</Term> — Comfortably inside standard lender limits.
                    </li>
                    <li>
                      <Term>Not Recommended</Term> — You can technically qualify at that price, but
                      it stretches you past the comfortable range.
                    </li>
                    <li>
                      <Term>Not Qualified</Term> — Above your maximum lending cap.
                    </li>
                  </ul>
                  <p>
                    A "Cash short" tag means the loan works but you'd need to save a bit more for
                    closing. You can adjust down payment, mortgage rate, and HOA on the results page
                    to explore scenarios in real time — nothing is saved unless you choose to.
                  </p>
                </div>
              </section>

              <section id="compare" className="scroll-mt-24">
                <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
                  Comparing affordability across states
                </h2>
                <div className="space-y-3 text-foreground/90 leading-relaxed">
                  <p>
                    The same income buys very different homes in different states because property
                    tax rates, insurance costs, and typical mortgage rates vary. Switch the state on
                    the calculator to see how your buying power changes — useful if you're deciding
                    where to live, or comparing your current city to a possible move.
                  </p>
                </div>
              </section>

              <section id="privacy" className="scroll-mt-24">
                <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
                  Your privacy
                </h2>
                <Card className="p-5 bg-accent/5 border-accent/30">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <div className="space-y-2 text-sm text-foreground/90 leading-relaxed">
                      <p>
                        <Term>throuly scout is buyer-only.</Term> We do not sell your data. We do
                        not share it with real-estate agents, lenders, or data brokers. You won't
                        get spam calls or a flood of "I saw your quote" emails.
                      </p>
                      <p>
                        Your calculations run in your browser and, if you choose to save them, in
                        your own private account. You can turn on{" "}
                        <Link to="/trust" className="underline">
                          Private Mode
                        </Link>{" "}
                        anytime to blur sensitive numbers on screen.
                      </p>
                    </div>
                  </div>
                </Card>
              </section>

              <section id="sitemap" className="scroll-mt-24">
                <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
                  Site map
                </h2>
                <SiteMap />
              </section>

              <section id="tour" className="scroll-mt-24">
                <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
                  Take the tour again
                </h2>
                <p className="text-foreground/90 leading-relaxed mb-4">
                  Want a refresher? Restart the guided walkthrough on the calculator page.
                </p>
                <Button onClick={restartTour} variant="accent" size="lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start the tour
                </Button>
              </section>
            </article>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
