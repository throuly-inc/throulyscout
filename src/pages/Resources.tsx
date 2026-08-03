import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Monitor,
  FileText,
  ExternalLink,
  Download,
  Video,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";
import { clearActiveBuyerSession } from "@/lib/buyerSessionStorage";
import { useAuth } from "@/hooks/useAuth";

const popularGuides = [
  {
    category: "Buyers",
    categoryColor: "bg-blue-100 text-blue-700",
    title: "Complete Buyer's Guide",
    description: "Everything you need to know about buying a home while keeping your privacy intact.",
    readTime: "12 min read",
    link: "/guides/buyers",
    gated: false,
  },
  {
    category: "Buyers",
    categoryColor: "bg-blue-100 text-blue-700",
    title: "Smart Buyer Strategies",
    description:
      "Advanced, fully compliant playbooks: FHA re-use, house hacking a 2–4 unit, and the starter-condo path.",
    readTime: "10 min read",
    link: "/guides/smart-buyer-strategies",
    gated: true,
  },
  {
    category: "Investors",
    categoryColor: "bg-blue-100 text-blue-700",
    title: "Understanding Cap Rates & Rental Yields",
    description: "Learn how to analyze investment properties and compare opportunities nationwide.",
    readTime: "8 min read",
    link: "/guides/investors",
    gated: false,
  },
];

const stateGuides = [
  {
    state: "California",
    topics: "Disclosure requirements, taxes, timelines",
  },
  {
    state: "Texas",
    topics: "Property taxes, HOA rules, closing process",
  },
  {
    state: "Florida",
    topics: "Homestead exemption, insurance, market trends",
  },
  {
    state: "New York",
    topics: "Co-ops vs condos, transfer taxes, attorney requirements",
  },
];

const videoTutorials = [
  {
    title: "Platform Overview: Getting Started",
    duration: "5:30",
  },
  {
    title: "Privacy Features Explained",
    duration: "3:45",
  },
  {
    title: "Using AI Investment Analysis",
    duration: "8:20",
  },
];

const faqs = [
  {
    question: "How does throuly protect my privacy?",
    answer: "Your contact information is never shared or sold. You control who can reach you and when. Browse properties, analyze markets, and explore opportunities completely anonymously.",
  },
  {
    question: "Can I really research homebuying without spam calls?",
    answer: "Absolutely. Unlike traditional platforms that sell your data, we keep your information private. You reach out to loan officers when you're ready — not the other way around.",
  },
  {
    question: "How accurate is the AI investment analysis?",
    answer: "Our AI analyzes real-time market data, rental trends, cap rates, and historical performance across all markets. While no prediction is guaranteed, our insights are based on comprehensive data to help you make informed decisions.",
  },
];



const Resources = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Real Estate Knowledge Center & Guides | throuly"
        description="Guides, calculators, and tools for buyers and investors. Learn how to navigate every step of the real estate journey."
        path="/resources"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "throuly Knowledge Center",
          description: "Guides, calculators, and tools for buyers and investors.",
          url: "https://throuly.com/resources",
          isPartOf: { "@type": "WebSite", name: "throuly", url: "https://throuly.com/" },
          hasPart: popularGuides
            .filter((g) => !g.gated)
            .map((g) => ({
              "@type": "Article",
              headline: g.title,
              description: g.description,
              url: `https://throuly.com${g.link}`,
            })),
        }}
      />
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              Knowledge Center
            </h1>
            <p className="text-lg text-muted-foreground">
              Everything you need to navigate real estate with confidence, privacy, and control.
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="guides" className="w-full">
            <TabsList className="flex w-full max-w-md mx-auto mb-12 bg-transparent border-b border-border rounded-none h-auto p-0">
              <TabsTrigger 
                value="guides" 
                className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-accent rounded-none bg-transparent py-3"
              >
                <Monitor className="w-4 h-4 mr-2" />
                Guides & Tutorials
              </TabsTrigger>
            </TabsList>

            {/* Guides & Tutorials Tab */}
            <TabsContent value="guides" className="space-y-16">
              {/* Popular Guides */}
              <section>
                <h2 className="font-serif text-2xl text-foreground mb-6">Popular Guides</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {popularGuides.map((guide) => {
                    const lockedForUser = guide.gated && !user;
                    return (
                      <Card key={guide.title} className="p-6 hover:border-accent/50 transition-colors flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <span className={`text-xs font-medium px-3 py-1 rounded-full ${guide.categoryColor}`}>
                            {guide.category}
                          </span>
                          {guide.gated ? (
                            <Lock className="w-5 h-5 text-muted-foreground" aria-label="Members only" />
                          ) : (
                            <FileText className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <h3 className="font-serif text-lg text-foreground mb-2">{guide.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 flex-1">{guide.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">{guide.readTime}</span>
                          <Link
                            to={guide.link}
                            className="text-sm text-accent hover:text-accent/80 flex items-center gap-1"
                          >
                            {lockedForUser ? "Sign in to read" : "Read Guide"}
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>


              {/* State-Specific Buying Guides */}
              <section>
                <h2 className="font-serif text-2xl text-foreground mb-2">State-Specific Buying Guides</h2>
                <p className="text-muted-foreground mb-6">Understand requirements, costs, and processes for buying in any state</p>
                <Card className="divide-y divide-border">
                  {stateGuides.map((guide) => (
                    <div key={guide.state} className="p-5 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-foreground">{guide.state} Real Estate Guide</h3>
                        <p className="text-sm text-muted-foreground">{guide.topics}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80">
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  ))}
                </Card>
                <Link to="#" className="text-accent hover:text-accent/80 text-sm flex items-center gap-1 mt-4">
                  View all 50 state guides
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </section>

              {/* Video Tutorials */}
              <section>
                <h2 className="font-serif text-2xl text-foreground mb-6">Video Tutorials</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {videoTutorials.map((video) => (
                    <Card key={video.title} className="overflow-hidden">
                      <div className="aspect-video bg-accent/10 flex items-center justify-center">
                        <Video className="w-10 h-10 text-accent/50" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-foreground text-sm">{video.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{video.duration}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>

              {/* FAQ Section */}
              <section>
                <Card className="p-8">
                  <h2 className="font-serif text-2xl text-foreground mb-6">Frequently Asked Questions</h2>
                  <div className="space-y-6">
                    {faqs.map((faq) => (
                      <div key={faq.question}>
                        <h3 className="font-medium text-foreground mb-2">{faq.question}</h3>
                        <p className="text-sm text-muted-foreground">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </section>

              {/* CTA Banner */}
              <section>
                <div className="bg-gradient-to-r from-purple-600 to-accent rounded-xl p-8 md:p-12 text-center">
                  <h2 className="font-serif text-2xl md:text-3xl text-white mb-3">
                    Ready to Get Started?
                  </h2>
                  <p className="text-white/80 mb-6">
                    Join the privacy-first real estate platform that puts you in control.
                  </p>
                  <Link to="/buyers" onClick={clearActiveBuyerSession}>
                    <Button variant="secondary" className="bg-white text-accent hover:bg-white/90">
                      Start Exploring
                    </Button>
                  </Link>
                </div>
              </section>
            </TabsContent>

          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Resources;
