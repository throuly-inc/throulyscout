import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";
import { clearActiveBuyerSession } from "@/lib/buyerSessionStorage";

const FAQ = [
  { q: "What's the difference between pre-approval and realistic affordability?", a: "Pre-approval is the maximum a lender will lend you based on debt-to-income ratios alone. Realistic affordability is what you can pay every month without giving up retirement contributions, travel, childcare, or a working emergency fund." },
  { q: "What percentage of income should go to a mortgage?", a: "A conservative rule is 25% of take-home pay on the full PITI payment (principal, interest, taxes, insurance). Lenders will let you stretch to 36–45% of gross income — that's the gap where most buyers get stuck house-poor." },
  { q: "Why does the bank approve me for more than I can afford?", a: "Lenders only see fixed debts on your credit report. They don't see groceries, childcare, retirement savings, or how often you eat out. Their ceiling is a regulatory limit, not a lifestyle budget." },
  { q: "How do I calculate what I can really afford?", a: "Start from take-home pay, subtract everything you actually spend in a normal month, and what's left is your housing capacity. throuly's calculator does this in five steps without a credit pull." },
];

const PUBLISHED = "June 20, 2026";

const RealisticAffordability = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Realistic Home Affordability Calculator | Throuly"
        description="Skip the bank's max-approval number. Use Throuly's home affordability calculator and a lifestyle-first method to find a price you can actually carry — without becoming house-poor."
        path="/guides/realistic-affordability"
        ogType="article"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "How to calculate what you can realistically afford",
            description: "A privacy-first, lifestyle-based method for sizing up a home budget — different from a lender's pre-approval ceiling.",
            datePublished: "2026-06-20",
            author: { "@type": "Organization", name: "The throuly Team" },
            publisher: { "@type": "Organization", name: "throuly", logo: { "@type": "ImageObject", url: "https://throuly.com/favicon.png" } },
            mainEntityOfPage: "https://throuly.com/guides/realistic-affordability",
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]}
      />
      <Navbar />

      <main className="pt-24 pb-16">
        <article className="container mx-auto px-4 max-w-3xl">
          <Link to="/resources" className="inline-flex items-center text-muted-foreground hover:text-accent mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </Link>

          <header className="mb-10">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">For Buyers</Badge>
            <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              How to calculate what you can realistically afford
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              The bank's pre-approval number is a ceiling, not a budget. Here's how to find the home price you can actually carry — without giving up the rest of your life.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-b py-3">
              <span className="font-medium text-foreground">By The throuly Team</span>
              <span>·</span>
              <span>{PUBLISHED}</span>
              <span>·</span>
              <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> 7 min read</span>
            </div>
          </header>

          <div className="prose-content space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Every lender will gladly tell you the most they'll let you borrow. That number is calculated from two pieces of data — your gross income and the fixed debts on your credit report — and it has almost nothing to do with whether you can actually live in the house.
            </p>
            <p>
              Realistic affordability is a different question. It's the price point where the mortgage, taxes, insurance, and upkeep all fit inside your real monthly spending — with room left for retirement, emergencies, and the rest of life.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">Step 1: Start with take-home, not gross</h2>
            <p>
              Lenders work in gross income. You don't. Pull your last three pay stubs and use the number that actually lands in your account after taxes, health insurance, and retirement contributions. That's the budget you're working with.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">Step 2: Subtract what you really spend</h2>
            <p>
              Open last month's bank and card statements. Total every non-housing line: groceries, transportation, childcare, subscriptions, eating out, gifts, travel. Don't aspire — copy what's there. The number left over is your true housing capacity.
            </p>
            <p>
              Most buyers find that capacity is 20–30% below their lender's maximum. That gap is the difference between owning a home and being owned by one.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">Step 3: Include the full PITI, not just principal and interest</h2>
            <p>
              A monthly mortgage payment is four numbers:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">P</strong>rincipal — paying down the loan.</li>
              <li><strong className="text-foreground">I</strong>nterest — the lender's cut.</li>
              <li><strong className="text-foreground">T</strong>axes — property tax, paid monthly into escrow.</li>
              <li><strong className="text-foreground">I</strong>nsurance — homeowner's insurance, plus PMI if you put less than 20% down.</li>
            </ul>
            <p>
              In high-tax states, taxes and insurance can equal a third of the total payment. Online calculators that only show principal and interest are lying by omission.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">Step 4: Add a maintenance reserve</h2>
            <p>
              A reasonable annual maintenance budget is 1–2% of the home's price. On a $400,000 house, that's $330–$660 per month set aside for the water heater, the roof, the HVAC, and the next surprise. Bake it into the payment before you decide what's affordable.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">Step 5: Stress-test the number</h2>
            <p>
              Ask: if one income disappeared for three months, could we still make this payment from savings? If the answer is no, the house is too expensive — regardless of what the lender approved.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">A useful rule of thumb</h2>
            <p>
              Keep the full PITI plus maintenance at or below <strong className="text-foreground">25% of take-home pay</strong>. Stretch to 28% if you have no other debt and a stable two-income household. Past 30% of take-home, every other category of spending starts shrinking to feed the house.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">How throuly does this for you</h2>
            <p>
              Our home affordability calculator walks you through these five steps in about three minutes — and it never pulls your credit. You get a realistic price range, the full monthly payment broken down by line, and a comparison to what a lender would approve so you can see the gap.
            </p>
          </div>

          <section className="mt-12">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle className="w-5 h-5 text-accent" />
              <h2 className="font-serif text-2xl text-foreground">FAQ</h2>
            </div>
            <div className="space-y-5">
              {FAQ.map((faq, i) => (
                <div key={i}>
                  <h3 className="font-medium text-foreground mb-1">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          <Card className="p-8 mt-12 text-center bg-gradient-to-r from-purple-600 to-accent text-white">
            <h2 className="font-serif text-2xl mb-3">See your real number</h2>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">
              Find out what you can comfortably afford — no credit pull, no calls.
            </p>
            <Link to="/buyers" onClick={clearActiveBuyerSession}>
              <Button variant="secondary" size="lg" className="bg-white text-accent hover:bg-white/90">
                Try the calculator
              </Button>
            </Link>
          </Card>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default RealisticAffordability;
