import { Link } from "react-router-dom";
import { clearActiveBuyerSession } from "@/lib/buyerSessionStorage";
import {
  Home,
  Calculator,
  MapPin,
  Heart,
  BarChart3,
  Building2,
  BookOpen,
  Shield,
  LayoutDashboard,
  Bookmark,
  Settings,
  Newspaper,
  LogIn,
} from "lucide-react";

interface Node {
  label: string;
  to: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const groups: { title: string; nodes: Node[] }[] = [
  {
    title: "Start here",
    nodes: [
      { label: "Home", to: "/", desc: "What throuly scout is and how it helps.", icon: Home },
      {
        label: "How It Works",
        to: "/how-it-works",
        desc: "Plain-English guide to every step.",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Your affordability flow",
    nodes: [
      {
        label: "Calculator",
        to: "/buyers",
        desc: "Enter income, debts, savings, credit range, and pick your state.",
        icon: Calculator,
      },
      {
        label: "State results",
        to: "/buyers",
        desc: "Tuned to your state's taxes, insurance, and rates.",
        icon: MapPin,
      },
      {
        label: "Financial health",
        to: "/homebuying-estimate/financial-health",
        desc: "See your Comfortable, Stretch, and Max buying power.",
        icon: Heart,
      },
      {
        label: "Affordability estimate",
        to: "/homebuying-estimate/results",
        desc: "Monthly payment, cash to close, and price comparisons.",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Explore & compare",
    nodes: [
      {
        label: "State programs",
        to: "/buyers/programs",
        desc: "First-time buyer and assistance programs by state.",
        icon: Building2,
      },
      { label: "Resources", to: "/resources", desc: "Guides and how-tos.", icon: BookOpen },
      { label: "News", to: "/news", desc: "Market updates.", icon: Newspaper },
      {
        label: "Trust & privacy",
        to: "/trust",
        desc: "How your data is protected.",
        icon: Shield,
      },
    ],
  },
  {
    title: "Your account",
    nodes: [
      { label: "Sign in / Sign up", to: "/auth", desc: "Save estimates to your account.", icon: LogIn },
      {
        label: "Dashboard",
        to: "/dashboard/client",
        desc: "Everything you've saved in one place.",
        icon: LayoutDashboard,
      },
      {
        label: "Saved estimates",
        to: "/dashboard/client/saved-estimates",
        desc: "Come back to any scenario.",
        icon: Bookmark,
      },
      {
        label: "Saved analyses",
        to: "/dashboard/client/saved-analyses",
        desc: "Market analyses you've saved from the Analyzer.",
        icon: MapPin,
      },
      {
        label: "Preferences & settings",
        to: "/settings/account",
        desc: "Notifications, privacy, and account.",
        icon: Settings,
      },
    ],
  },
];

export function SiteMap() {
  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground max-w-2xl">
        Here's the full map of throuly scout — every page and how they connect. Click any card to
        jump straight there.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        {groups.map((group) => (
          <div
            key={group.title}
            className="rounded-2xl border border-border bg-card/50 p-5"
          >
            <h3 className="font-serif text-lg text-foreground mb-4">{group.title}</h3>
            <div className="space-y-2">
              {group.nodes.map((n, idx) => (
                <div key={n.label} className="relative">
                  <Link
                    to={n.to}
                    onClick={n.to === "/buyers" ? clearActiveBuyerSession : undefined}
                    className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/60 p-3 hover:border-accent hover:bg-accent/5 transition-colors"
                  >
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <n.icon className="w-4 h-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">{n.label}</span>
                      <span className="block text-xs text-muted-foreground leading-snug">
                        {n.desc}
                      </span>
                    </span>
                  </Link>
                  {idx < group.nodes.length - 1 && (
                    <div className="ml-4 h-2 border-l border-dashed border-border/70" aria-hidden />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
