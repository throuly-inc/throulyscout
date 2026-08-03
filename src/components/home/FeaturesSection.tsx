import { Search, CheckCircle, BarChart3, Shield, DollarSign, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { clearActiveBuyerSession } from "@/lib/buyerSessionStorage";
import buyerLifestyle from "@/assets/buyer-lifestyle.jpg";

const features = [
  { icon: Shield, title: "Privacy first", description: "No spam calls, ever" },
  { icon: BarChart3, title: "Complete analysis", description: "DTI, PMI, taxes included" },
  { icon: DollarSign, title: "All 50 states", description: "State-specific calculations" },
];

export function FeaturesSection() {
  return (
    <section style={{ background: "#eeebe0", padding: "7rem 0" }} className="relative overflow-hidden">
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-120px",
          right: "-80px",
          width: "380px",
          height: "380px",
          background: "radial-gradient(circle, rgba(91,91,214,0.10), transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <span
            className="inline-block mb-5"
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              color: "#5b5bd6",
            }}
          >
            Built for Buyer | Your Journey
          </span>
          <h2
            className="font-serif mb-5"
            style={{
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              fontWeight: 600,
              color: "#0c0e1a",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            Calculate. <em style={{ color: "#5b5bd6", fontWeight: 500 }}>Compare.</em> Close.
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#4a4d63", maxWidth: "600px", margin: "0 auto", lineHeight: 1.7 }}>
            Get instant affordability insights across all 50 states. Know exactly what you can afford before you start
            your search.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-6xl mx-auto mb-12 items-center">
          {/* Lifestyle image */}
          <div className="lg:col-span-2 relative">
            <div
              style={{
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 30px 60px -25px rgba(12,14,26,0.35)",
                border: "1px solid rgba(12,14,26,0.08)",
                aspectRatio: "4 / 5",
              }}
            >
              <img
                src={buyerLifestyle}
                alt="Homebuyer reviewing their affordability results"
                loading="lazy"
                width={1000}
                height={1250}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
            {/* Floating stat card */}
            <div
              className="hidden md:block absolute"
              style={{
                bottom: -22,
                right: -22,
                background: "#f7f4ee",
                border: "1px solid rgba(12,14,26,0.08)",
                borderRadius: 14,
                padding: "14px 18px",
                boxShadow: "0 20px 40px -15px rgba(12,14,26,0.25)",
              }}
            >
              <div
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#5b5bd6",
                }}
              >
                All 50 states
              </div>
              <div
                className="font-serif"
                style={{ fontSize: "1.4rem", fontWeight: 500, color: "#0c0e1a", marginTop: 2 }}
              >
                Real numbers.
              </div>
            </div>
          </div>

          {/* Feature cards */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="transition-all duration-200 hover:-translate-y-1"
                  style={{
                    background: "#f7f4ee",
                    border: "1px solid rgba(12,14,26,0.06)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: "rgba(91,91,214,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon style={{ width: 20, height: 20, color: "#5b5bd6" }} strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="font-serif mb-1" style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0c0e1a" }}>
                      {feature.title}
                    </h4>
                    <p style={{ fontSize: "0.88rem", color: "#3a3d54", lineHeight: 1.6, fontWeight: 500 }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <Link to="/buyers" onClick={clearActiveBuyerSession}>
            <button
              className="transition-all duration-200"
              style={{
                background: "#0c0e1a",
                color: "#f7f4ee",
                fontSize: "0.82rem",
                fontWeight: 600,
                padding: "12px 28px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try Calculator <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
