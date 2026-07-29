import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Shield,
  Zap,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";

const benefits = [
  {
    icon: Zap,
    title: "Instant Access",
    description: "Start using all features immediately after signup"
  },
  {
    icon: Shield,
    title: "No Credit Card",
    description: "Try everything free for 7 days, no payment required"
  },
  {
    icon: Users,
    title: "Full Support",
    description: "Get onboarding help from our team whenever you need"
  },
];

const features = [
  "Unlimited transactions",
  "Digital signatures",
  "Client portal access",
  "Performance analytics",
  "Mobile app access",
  "Priority support",
];

export default function TryItFree() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Start your free trial today
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
                Try throuly Free for 7 Days
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Experience the full power of our platform. No credit card required, 
                cancel anytime.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button size="lg" className="gap-2 min-w-[200px]">
                    Create Free Account <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="min-w-[200px]">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>

            {/* Benefits Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div 
                    key={index} 
                    className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
                  >
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Features List */}
            <div className="bg-secondary/30 rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-serif text-foreground text-center mb-8">
                Everything included in your free trial
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Badge */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 text-muted-foreground">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-background"
                    />
                  ))}
                </div>
                <span className="text-sm">
                  Join <strong className="text-foreground">10,000+</strong> professionals already using throuly
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
