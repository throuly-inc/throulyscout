import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";
import heroImage from "@/assets/guides/investors-hero.jpg";
import { isGuideFaqVisible } from "@/config/guideFaqVisibility";

const SHOW_FAQ = isGuideFaqVisible("investors");

const INVESTORS_FAQ = [
  { q: "What's a good cap rate?", a: "Depends on the market. 4–6% is normal in appreciating metros; 8–12% shows up in smaller or higher-risk markets. Compare to the local average, not a national one." },
  { q: "Cap rate or appreciation — which matters more?", a: "Depends on your goal. Cash-flow investors chase higher cap rates. Wealth-building investors accept lower ones in growth markets. Most experienced investors want both within reason." },
  { q: "Where do I find honest rent estimates?", a: "Look at active listings and recently leased comps in the same neighborhood. throuly pulls local rental data so you're not guessing." },
  { q: "Does cap rate include the mortgage?", a: "No. Cap rate is NOI divided by price — before debt. Use cash-on-cash return to see what leverage does." },
  { q: "How much do property taxes affect returns?", a: "A lot. Two identical homes in different states can have wildly different cash flow. Always model the tax line." },
];

const PUBLISHED = "May 16, 2026";

const InvestorsGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Investor's Guide | Home Affordability Calculator — Throuly"
        description="A working investor's primer on cap rate, NOI, and cash-on-cash return — pair it with Throuly's home affordability calculator to compare deals across any market."
        path="/guides/investors"
        ogType="article"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "Cap Rates, Yields, and Real Returns",
            description: "A working investor's primer on cap rate, NOI, and cash-on-cash return.",
            datePublished: "2026-05-16",
            image: `https://throuly.com${heroImage}`,
            author: { "@type": "Organization", name: "The throuly Team" },
            publisher: { "@type": "Organization", name: "throuly", logo: { "@type": "ImageObject", url: "https://throuly.com/favicon.png" } },
            mainEntityOfPage: "https://throuly.com/guides/investors",
          },
          ...(SHOW_FAQ
            ? [
                {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: INVESTORS_FAQ.map((f) => ({
                    "@type": "Question",
                    name: f.q,
                    acceptedAnswer: { "@type": "Answer", text: f.a },
                  })),
                },
              ]
            : []),
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
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">For Investors</Badge>
            <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              Cap rates, yields, and what the numbers really mean
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              A working investor's primer: how to read cap rate, NOI, and cash-on-cash return so you can compare deals across any market — without falling for the pitch deck.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-b py-3">
              <span className="font-medium text-foreground">By The throuly Team</span>
              <span>·</span>
              <span>{PUBLISHED}</span>
              <span>·</span>
              <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> 5 min read</span>
            </div>
          </header>

          <figure className="mb-10 -mx-4 md:mx-0">
            <img
              src={heroImage}
              alt="Modern townhomes with clean geometric facades at golden hour"
              width={1920}
              height={1080}
              className="w-full h-auto md:rounded-lg object-cover aspect-[16/9]"
            />
          </figure>

          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Real estate is one of the few investments where the seller hands you the spreadsheet. That spreadsheet is almost always optimistic. The job isn't to trust it — it's to rebuild it.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">Cap rate, in plain English</h2>
            <p>
              Cap rate is Net Operating Income divided by price. A $200,000 property generating $12,000 NOI is a 6% cap. That's the unlevered yield — what the property earns before any mortgage. Higher cap usually means higher risk, not free money.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">Net Operating Income is where deals lie</h2>
            <p>
              Start with gross rent. Subtract taxes, insurance, maintenance reserves, vacancy, and management — whether or not you plan to self-manage. Do <em>not</em> subtract the mortgage. The most common way pro formas inflate returns is by skipping reserves and assuming zero vacancy. Don't.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">A quick first-pass check: gross yield</h2>
            <p>
              Annual rent ÷ purchase price. If a $200,000 home rents for $1,500 a month, gross yield is 9%. It's a back-of-the-napkin number — useful for triaging listings, not for closing on one.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">Cash-on-cash tells you the real story</h2>
            <p>
              Cap rate ignores your loan. Cash-on-cash doesn't. Take your annual pre-tax cash flow and divide by everything you actually put in — down payment, closing costs, initial repairs. This is the number your bank account feels. Our <Link to="/buyers" className="underline underline-offset-2 hover:text-foreground">home affordability calculator</Link> can size the loan side for you in seconds.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">Don't forget the boring expenses</h2>
            <p>
              Roofs, HVAC, water heaters, appliances — they all die on a schedule. Reserve 1–2% of property value per year for capital expenditures. The deal that pencils without reserves doesn't actually pencil.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">Cash flow vs. appreciation</h2>
            <p>
              Cap rates and appreciation usually trade off. High-cap markets cash flow today but grow slowly. Low-cap metros squeeze your monthly but build wealth over a decade. Decide which one you're buying before you fall in love with a listing.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">Mistakes we see all the time</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Trusting the seller's rent roll. Always pull the actual leases.</li>
              <li>Modeling 0% vacancy. Even great properties turn over.</li>
              <li>Skipping the management line because "I'll do it myself." Your time has a price.</li>
              <li>Chasing the highest cap rate without looking at the block.</li>
            </ul>

            <h2 className="font-serif text-2xl text-foreground pt-4">A note from the team</h2>
            <p>
              The best deals usually look boring on paper. The worst deals usually look amazing. When a pro forma sparkles, rebuild it from scratch — and walk away if it stops sparkling under honest numbers.
            </p>
          </div>

          {SHOW_FAQ && (
            <section className="mt-12">
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle className="w-5 h-5 text-accent" />
                <h2 className="font-serif text-2xl text-foreground">FAQ</h2>
              </div>
              <div className="space-y-5">
                {INVESTORS_FAQ.map((faq, i) => (
                  <div key={i}>
                    <h3 className="font-medium text-foreground mb-1">{faq.q}</h3>
                    <p className="text-muted-foreground">{faq.a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <Card className="p-8 mt-12 text-center bg-gradient-to-r from-purple-600 to-accent text-white">
            <h2 className="font-serif text-2xl mb-3">Run the numbers — honestly</h2>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">
              Model cap rate, NOI, and cash-on-cash across any market in the country.
            </p>
            <Link to="/buyers">
              <Button variant="secondary" size="lg" className="bg-white text-accent hover:bg-white/90">
                Start analyzing properties
              </Button>
            </Link>
          </Card>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default InvestorsGuide;
