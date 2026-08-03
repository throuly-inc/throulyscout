import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";
import { clearActiveBuyerSession } from "@/lib/buyerSessionStorage";
import heroImage from "@/assets/guides/buyers-hero.jpg";
import { isGuideFaqVisible } from "@/config/guideFaqVisibility";

const SHOW_FAQ = isGuideFaqVisible("buyers");

const BUYERS_FAQ = [
  { q: "How much do I really need for a down payment?", a: "Less than most people think. Conventional loans start around 5%, FHA at 3.5%, and VA at 0% for eligible veterans. Our calculator shows the exact number for your budget." },
  { q: "Does throuly affect my credit score?", a: "No. We never pull credit. You decide when (and if) a lender does." },
  { q: "How do I know I'm paying a fair price?", a: "Look at recent comps, check days on market, and lean on a local agent. throuly surfaces the true monthly cost — taxes, insurance, and fees included — so you're comparing the whole picture." },
  { q: "Can I buy in a different state?", a: "Yes, and a lot of our users do. throuly compares costs and rules across all 50 states side by side." },
  { q: "What if I need to sell first?", a: "You can write a sale-contingent offer or look at bridge financing. Our Seller's Guide walks through both." },
];

const PUBLISHED = "March 14, 2026";

const BuyersGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Buyer's Guide | Home Affordability Calculator — Throuly"
        description="A privacy-first buyer's playbook: size up your budget with Throuly's home affordability calculator, explore listings without spam, and step into the market on your terms."
        path="/guides/buyers"
        ogType="article"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "The Quiet Way to Buy a Home",
            description: "A privacy-first homebuying playbook from the throuly team.",
            datePublished: "2026-03-14",
            image: `https://throuly.com${heroImage}`,
            author: { "@type": "Organization", name: "The throuly Team" },
            publisher: { "@type": "Organization", name: "throuly", logo: { "@type": "ImageObject", url: "https://throuly.com/favicon.png" } },
            mainEntityOfPage: "https://throuly.com/guides/buyers",
          },
          ...(SHOW_FAQ
            ? [
                {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: BUYERS_FAQ.map((f) => ({
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
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">For Buyers</Badge>
            <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              The quiet way to buy a home
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              How to figure out what you can actually afford, explore listings without inviting the spam, and step into the market on your own schedule.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-b py-3">
              <span className="font-medium text-foreground">By The throuly Team</span>
              <span>·</span>
              <span>{PUBLISHED}</span>
              <span>·</span>
              <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> 6 min read</span>
            </div>
          </header>

          <figure className="mb-10 -mx-4 md:mx-0">
            <img
              src={heroImage}
              alt="A quiet wooden table with a coffee mug, keys, and a notebook by a sunlit window"
              width={1920}
              height={1080}
              className="w-full h-auto md:rounded-lg object-cover aspect-[16/9]"
            />
          </figure>

          <div className="prose-content space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Most homebuying advice starts with "get pre-approved." We think that's the wrong first step. The moment your number hits a lender's portal, you're on a dozen call lists. Before any of that, you deserve a clear, honest picture of what you can carry — privately.
            </p>
            <p>
              Here's how we'd approach it if we were starting today.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">Start with the math, not the listings</h2>
            <p>
              Pull together monthly take-home, recurring debts, and the cash you've earmarked for a down payment. Plug those into the throuly home affordability calculator. It returns a real price range — including taxes, insurance, and PMI — without touching your credit.
            </p>
            <p>
              That number will surprise you in one of two directions. Either way, you now have the most important data point in the whole process before talking to anyone.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">Decide what's non-negotiable</h2>
            <p>
              Bedrooms, commute, school zone, yard. Write down three things you won't compromise on and three you'd like but can live without. This list keeps you honest when a beautiful kitchen tries to make you forget about a two-hour commute.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">Compare markets, not just houses</h2>
            <p>
              Two homes with the same sticker price can cost wildly different amounts to own. Property tax, insurance, and HOA fees move the monthly number by hundreds — sometimes thousands. throuly breaks down those costs by state so you can compare Phoenix and Charlotte the way they actually live in your budget.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">Browse on your terms</h2>
            <p>
              Save the homes you like to your private profile. No phone number, no "an agent will reach out shortly." When you're ready to talk to someone, you choose who — from our vetted directory — and you control the channel.
            </p>

            <h2 className="font-serif text-2xl text-foreground pt-4">Mistakes we see all the time</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Handing out your phone number on listing portals "just to see the photos."</li>
              <li>Forgetting closing costs run 2–5% of the price, on top of the down payment.</li>
              <li>Financing a car or a couch the month before close — your DTI moves, and so does your approval.</li>
              <li>Skipping the inspection to make an offer look stronger. The surprises will cost more than the inspection ever would.</li>
            </ul>

            <h2 className="font-serif text-2xl text-foreground pt-4">A note from the team</h2>
            <p>
              Buying a home is one of the few big financial moves that's still designed to be loud — calls, texts, follow-ups, urgency. It doesn't have to be. Move slowly, do the math twice, and let the process feel boring. Boring is good. Boring closes.
            </p>
          </div>

          {SHOW_FAQ && (
            <section className="mt-12">
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle className="w-5 h-5 text-accent" />
                <h2 className="font-serif text-2xl text-foreground">FAQ</h2>
              </div>
              <div className="space-y-5">
                {BUYERS_FAQ.map((faq, i) => (
                  <div key={i}>
                    <h3 className="font-medium text-foreground mb-1">{faq.q}</h3>
                    <p className="text-muted-foreground">{faq.a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

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

export default BuyersGuide;
