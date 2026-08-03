import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Home, BadgeDollarSign, BookOpen, HelpCircle } from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import { clearActiveBuyerSession } from "@/lib/buyerSessionStorage";
import { getStateByAbbreviation, getStateByName, statesData } from "@/lib/states";
import { formatCurrency } from "@/lib/calculator";

const PROGRAMS = {
  "First-Time Homebuyer": "State-administered grants or loans for buyers who haven't owned a home in the past three years.",
  "Down Payment Assistance": "Deferred or forgivable second loans that cover part of the down payment, often paired with a primary mortgage.",
  "Closing Cost Help": "Funds that offset lender fees, title charges, prepaid taxes, and insurance at closing.",
  "Tax Credit": "Mortgage credit certificates that reduce federal tax liability, freeing up monthly income for the mortgage payment.",
};

const FAQ = [
  { q: "Who qualifies for first-time buyer programs?", a: "Most programs define a first-time buyer as someone who hasn't owned a home in the last three years. Income limits and purchase-price caps apply and vary by state." },
  { q: "Do I need perfect credit?", a: "No. FHA-backed programs often accept scores starting in the mid-600s, while conventional options may prefer 680+. Each program sets its own minimum." },
  { q: "Can I combine programs?", a: "Sometimes. You can often stack a first-time buyer grant with a mortgage credit certificate, but rules vary by state and lender." },
  { q: "How do I find the official application?", a: "Start with the state's Housing Finance Agency. The page below links to the official site for the program you're exploring." },
];

export const StateProgramsGuide = () => {
  const { state } = useParams<{ state: string }>();
  const normalized = state?.trim().toLowerCase() || "";
  const stateData = useMemo(() => {
    return getStateByAbbreviation(normalized.toUpperCase()) || getStateByName(normalized);
  }, [normalized]);

  if (!stateData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 container mx-auto px-4 text-center">
          <h1 className="font-serif text-3xl text-foreground mb-4">State not found</h1>
          <p className="text-muted-foreground mb-6">We don't have a guide for that state yet.</p>
          <Link to="/resources">
            <Button variant="outline">Back to Resources</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const stateName = stateData.name;
  const stateAbbr = stateData.abbreviation;
  const title = `First-Time Buyer Programs in ${stateName} | Throuly`;
  const description = `Explore down payment assistance, first-time buyer grants, closing cost help, and tax credits available in ${stateName}. Use Throuly's home affordability calculator to see how much house you can afford.`;
  const path = `/guides/programs/${stateAbbr.toLowerCase()}`;
  const published = "2026-07-10";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={title}
        description={description}
        path={path}
        ogType="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description,
          datePublished: published,
          author: { "@type": "Organization", name: "The throuly Team" },
          publisher: { "@type": "Organization", name: "throuly", logo: { "@type": "ImageObject", url: "https://throulyscout.com/favicon-v2.png" } },
          mainEntityOfPage: `https://throulyscout.com${path}`,
        }}
      />
      <Navbar />

      <main className="pt-24 pb-16">
        <article className="container mx-auto px-4 max-w-3xl">
          <Link to="/resources" className="inline-flex items-center text-muted-foreground hover:text-accent mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </Link>

          <header className="mb-10">
            <Badge className="mb-4 bg-accent/20 text-accent border-accent/30 hover:bg-accent/20">For Buyers</Badge>
            <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              First-Time Buyer Programs in {stateName}
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Down payment assistance, grants, closing cost help, and tax credits for homebuyers in {stateName}. Pair them with Throuly's home affordability calculator to see your real budget.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-b py-3">
              <span className="font-medium text-foreground">By The throuly Team</span>
              <span>·</span>
              <span>{published}</span>
              <span>·</span>
              <span className="flex items-center"><BookOpen className="w-4 h-4 mr-1" /> 4 min read</span>
            </div>
          </header>

          <div className="prose-content space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Buying your first home in {stateName} doesn't have to start with a blank check. The state offers programs designed to lower the upfront cost and make the monthly payment easier to carry. Most are run through the state's Housing Finance Agency and partner lenders, so the first step is usually finding a participating loan officer.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">What programs are available in {stateName}?</h2>
            <div className="grid gap-4">
              {Object.entries(PROGRAMS).map(([name, body]) => (
                <Card key={name} className="p-5">
                  <div className="flex items-start gap-3">
                    <BadgeDollarSign className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-medium text-foreground mb-1">{name}</h3>
                      <p className="text-muted-foreground">{body}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <h2 className="font-serif text-2xl text-foreground pt-4">What the numbers look like in {stateName}</h2>
            <p>
              The median home price in {stateName} is about {formatCurrency(stateData.medianHomePrice)}, and average property taxes run about {(stateData.avgPropertyTax * 100).toFixed(2)}% of assessed value. Insurance is roughly {formatCurrency(stateData.avgHomeInsurance * 1000)} per year for a typical home. These numbers affect both your monthly payment and the closing costs you need to save for.
            </p>
            <p>
              A good first step is to estimate your total monthly payment — principal, interest, taxes, insurance, and any HOA or PMI — then see how much of your take-home pay it eats. That's where the home affordability calculator comes in.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">How to apply for {stateName} first-time buyer programs</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Confirm you qualify as a first-time buyer (no ownership in the last three years).</li>
              <li>Check your income and the purchase-price limits for your county.</li>
              <li>Find a lender approved by the state's Housing Finance Agency.</li>
              <li>Get pre-approved through that lender and ask them to layer in the assistance program.</li>
              <li>Complete homebuyer education if the program requires it.</li>
            </ol>

            <h2 className="font-serif text-2xl text-foreground pt-4">What to watch out for</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Some assistance is a silent second loan that must be repaid when you sell or refinance.</li>
              <li>Grants may require you to live in the home as a primary residence for several years.</li>
              <li>Program funds can run out, so get pre-approved early in the year.</li>
              <li>Not all lenders participate, so confirm the program is available with your chosen loan officer.</li>
            </ul>
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
            <div className="flex items-center justify-center gap-2 mb-3">
              <Home className="w-6 h-6" />
              <h2 className="font-serif text-2xl">Find your {stateName} budget</h2>
            </div>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">
              Plug in your income, debts, and savings to see what you can afford — including taxes, insurance, and PMI. No credit pull.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={`/buyers?state=${stateAbbr}`} onClick={clearActiveBuyerSession}>
                <Button variant="secondary" size="lg" className="bg-white text-accent hover:bg-white/90">
                  Try the calculator
                </Button>
              </Link>
              <Link to={`/buyers/programs?state=${stateName}`}>
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  See matched programs
                </Button>
              </Link>
            </div>
          </Card>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default StateProgramsGuide;

export const stateProgramPaths = statesData.map((s) => `/guides/programs/${s.abbreviation.toLowerCase()}`);
