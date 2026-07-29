import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock, Search } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";

import featuredAffordability from "@/assets/news/featured-affordability.jpg";
import featuredPrivacy from "@/assets/news/featured-privacy.jpg";
import researchStates from "@/assets/news/research-states.jpg";
import researchDoors from "@/assets/news/research-doors.jpg";
import buyersHero from "@/assets/guides/buyers-hero.jpg";
import sellersHero from "@/assets/guides/buyers-hero.jpg";
import agentsHero from "@/assets/guides/buyers-hero.jpg";
import investorsHero from "@/assets/guides/investors-hero.jpg";

const SECTION_TABS = [
  { label: "News", href: "/news", active: true },
  { label: "Company News", href: "/news" },
  { label: "Research", href: "/news" },
  { label: "Product", href: "/news" },
  { label: "Privacy & Advocacy", href: "/news" },
  { label: "throuly Culture", href: "/news" },
];

type Article = {
  image: string;
  alt: string;
  readMin: number;
  category: string;
  title: string;
  excerpt: string;
  href: string;
};

const FEATURED: Article[] = [
  {
    image: featuredAffordability,
    alt: "Aerial view of a suburban neighborhood at golden hour",
    readMin: 6,
    category: "Research",
    title: "What's really behind the buyer affordability gap in 2026",
    excerpt:
      "Wages are up, rates are down a touch, and prices barely moved. So why does buying still feel impossible? throuly's data team breaks down the real math behind the monthly payment.",
    href: "/guides/buyers",
  },
  {
    image: featuredPrivacy,
    alt: "Phone on a desk showing a privacy lock icon",
    readMin: 4,
    category: "Privacy & Advocacy",
    title: "Why we'll never ask for your phone number to show you a house",
    excerpt:
      "Every other listing portal trades your contact info for photos. We took a different bet. Here's the privacy stance behind throuly and what it means for buyers.",
    href: "/guides/buyers",
  },
  {
    image: investorsHero,
    alt: "Modern townhomes at golden hour",
    readMin: 5,
    category: "Research",
    title: "Where the math works: 12 cities investors are quietly watching",
    excerpt:
      "Cap rates, rent-to-price ratios, and tax burden — combined into a single livability-for-capital score across 50 states.",
    href: "/guides/investors",
  },
  {
    image: agentsHero,
    alt: "Minimalist desk workspace with a laptop and notebook",
    readMin: 4,
    category: "Product",
    title: "Buyer roadmap: your homebuying journey, made simple",
    excerpt:
      "A step-by-step, self-service roadmap that walks first-time buyers from savings goal to keys in hand — with the receipts to show why each step matters.",
    href: "/guides/buyers",
  },
];

const RESEARCH: Article[] = [
  {
    image: researchStates,
    alt: "Paper US map with small wooden house markers",
    readMin: 5,
    category: "Research",
    title: "The 50-state affordability index, updated for Q2 2026",
    excerpt:
      "Where a $75k household can still comfortably buy — and where the math has quietly fallen apart.",
    href: "/guides/buyers",
  },
  {
    image: researchDoors,
    alt: "Row of colorful modern front doors",
    readMin: 3,
    category: "Research",
    title: "Front doors and resale: what color actually lifts an offer",
    excerpt:
      "We looked at 18,000 closed sales. The cheapest renovation in real estate is still a gallon of paint — but only in three colors.",
    href: "/guides/buyers",
  },
  {
    image: buyersHero,
    alt: "Coffee mug, keys, and a notebook on a sunlit wooden table",
    readMin: 6,
    category: "Buyer guide",
    title: "The quiet way to buy a home",
    excerpt:
      "A privacy-first homebuying playbook from the throuly team. No credit pull, no calls, no surprises.",
    href: "/guides/buyers",
  },
  {
    image: sellersHero,
    alt: "Sunlit living room with a mid-century chair",
    readMin: 7,
    category: "Buyer research",
    title: "What a slower market means for first-time buyers in 2026",
    excerpt:
      "Inventory is up, days on market are stretching. Here's how throuly's affordability model shows you where the leverage has shifted back toward buyers.",
    href: "/guides/buyers",
  },
];

function ArticleMeta({ readMin, category }: { readMin: number; category: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground font-news">
      <span className="font-semibold uppercase tracking-wider text-[11px] text-accent">
        {category}
      </span>
      <span className="text-foreground/50" aria-hidden="true">·</span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        {readMin} min read
      </span>
    </div>
  );
}

function ResearchCard({ article }: { article: Article }) {
  return (
    <Link
      to={article.href}
      className="group flex flex-col gap-4 font-news"
    >
      <div className="overflow-hidden rounded-lg aspect-[16/10] bg-muted">
        <img
          src={article.image}
          alt={article.alt}
          loading="lazy"
          width={1536}
          height={896}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <ArticleMeta readMin={article.readMin} category={article.category} />
      <h3 className="font-news font-extrabold text-2xl leading-[1.15] text-foreground group-hover:text-accent transition-colors">
        {article.title}
      </h3>
      <p className="text-foreground/70 leading-relaxed text-[15px]">
        {article.excerpt}
      </p>
    </Link>
  );
}

const News = () => {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollFeatured = (dir: "prev" | "next") => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "next" ? el.clientWidth : -el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background font-news">
      <SEO
        title="throuly Newsroom — Private homebuying news, data & research"
        description="throuly's home for news, data, insights and official perspectives on private homebuying, the U.S. housing market, and the future of real estate."
        path="/news"
        ogType="website"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "throuly Newsroom",
            description:
              "News, data and perspectives on private homebuying from the throuly team.",
            url: "https://throuly.com/news",
            publisher: {
              "@type": "Organization",
              name: "throuly",
              logo: {
                "@type": "ImageObject",
                url: "https://throuly.com/favicon.png",
              },
            },
            blogPost: [...FEATURED, ...RESEARCH].map((a) => ({
              "@type": "BlogPosting",
              headline: a.title,
              description: a.excerpt,
              url: `https://throuly.com${a.href}`,
              image: `https://throuly.com${a.image}`,
              author: { "@type": "Organization", name: "The throuly Team" },
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://throuly.com/" },
              { "@type": "ListItem", position: 2, name: "Newsroom", item: "https://throuly.com/news" },
            ],
          },
        ]}
      />
      <Navbar />

      <main className="pt-20">
        {/* Subnav bar (Zillow Front Porch style) */}
        <div className="border-b border-foreground/10 bg-background">
          <div className="container mx-auto px-6 flex items-center justify-between h-[68px]">
            <Link to="/news" className="font-news font-extrabold text-xl tracking-tight text-foreground">
              throuly <span className="text-muted-foreground font-bold">Newsroom</span>
            </Link>
            <div className="hidden md:flex items-center gap-3">
              <Button variant="outline" size="sm" className="font-news font-semibold rounded-full">
                Subscribe
              </Button>
              <a href="mailto:press@throuly.com">
                <Button size="sm" className="font-news font-semibold rounded-full bg-accent hover:bg-accent/90 text-white">
                  Press Inquiries
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Section tabs */}
        <div className="border-b border-foreground/10 bg-background sticky top-20 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <div className="container mx-auto px-6 flex items-center justify-between gap-6 h-14 overflow-x-auto no-scrollbar">
            <nav className="flex items-center gap-1 font-news">
              {SECTION_TABS.map((tab) => (
                <Link
                  key={tab.label}
                  to={tab.href}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                    tab.active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
            <div className="hidden lg:flex items-center gap-2 border border-foreground/15 rounded-full px-4 py-1.5 w-64">
              <Search className="w-4 h-4 text-foreground/50" />
              <input
                type="text"
                placeholder="Search"
                aria-label="Search the newsroom"
                className="bg-transparent border-0 outline-none text-sm font-news placeholder:text-foreground/40 w-full"
              />
            </div>
          </div>
        </div>

        {/* Hero title */}
        <section className="container mx-auto px-6 pt-20 pb-12 text-center">
          <h1 className="font-news font-extrabold text-foreground tracking-[-0.03em] text-5xl md:text-7xl lg:text-[88px] leading-[0.95]">
            throuly Newsroom
          </h1>
          <p className="font-news mt-6 text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto">
            throuly's home for news, data, insights and official perspectives on private homebuying and the U.S. housing market.
          </p>
        </section>

        {/* Featured carousel */}
        <section className="pb-20">
          <div
            ref={carouselRef}
            className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
          >
            {FEATURED.map((article, idx) => (
              <article
                key={idx}
                className="flex-none w-full snap-center"
              >
                <div className="container mx-auto px-6">
                  <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                    <div className="overflow-hidden rounded-xl aspect-[16/10] bg-muted order-1">
                      <img
                        src={article.image}
                        alt={article.alt}
                        loading={idx === 0 ? "eager" : "lazy"}
                        width={1536}
                        height={896}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="order-2">
                      <ArticleMeta readMin={article.readMin} category={article.category} />
                      <h2 className="font-news font-extrabold text-foreground mt-6 text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em]">
                        {article.title}
                      </h2>
                      <p className="font-news text-foreground/70 mt-6 text-lg leading-relaxed max-w-xl">
                        {article.excerpt}
                      </p>
                      <Link to={article.href} className="inline-block mt-8">
                        <Button
                          size="lg"
                          className="font-news font-semibold rounded-full bg-accent hover:bg-accent/90 text-white px-7"
                        >
                          Read article
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Carousel controls */}
          <div className="container mx-auto px-6 mt-10 flex justify-end gap-3">
            <button
              type="button"
              aria-label="Previous featured article"
              onClick={() => scrollFeatured("prev")}
              className="w-11 h-11 rounded-full border border-foreground/20 flex items-center justify-center text-foreground/70 hover:text-foreground hover:border-foreground/50 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Next featured article"
              onClick={() => scrollFeatured("next")}
              className="w-11 h-11 rounded-full border border-foreground/20 flex items-center justify-center text-foreground/70 hover:text-foreground hover:border-foreground/50 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Latest throuly research */}
        <section className="container mx-auto px-6 pb-20">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <h2 className="font-news font-extrabold text-foreground text-3xl md:text-4xl tracking-[-0.02em]">
              Latest throuly Research
            </h2>
            <Link
              to="/resources"
              className="font-news text-sm font-semibold text-accent hover:underline"
            >
              See all research →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {RESEARCH.map((article, idx) => (
              <ResearchCard key={idx} article={article} />
            ))}
          </div>
        </section>

        {/* Subscribe band */}
        <section id="subscribe" className="border-t border-foreground/10 bg-secondary/40">
          <div className="container mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="font-news font-extrabold text-foreground text-3xl md:text-4xl tracking-[-0.02em]">
                Get the throuly briefing
              </h2>
              <p className="font-news text-foreground/70 mt-4 text-lg max-w-md">
                One thoughtful email a month — housing data, product updates and the occasional opinion. No spam. Ever.
              </p>
            </div>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col sm:flex-row gap-3 w-full"
              aria-label="Subscribe to the throuly newsroom"
            >
              <label htmlFor="news-email" className="sr-only">Email address</label>
              <input
                id="news-email"
                type="email"
                required
                placeholder="you@example.com"
                className="font-news flex-1 rounded-full border border-foreground/20 bg-background px-5 py-3 text-base outline-none focus:border-accent"
              />
              <Button
                type="submit"
                size="lg"
                className="font-news font-semibold rounded-full bg-accent hover:bg-accent/90 text-white px-7"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default News;
