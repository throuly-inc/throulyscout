import { Link } from "react-router-dom";
import { ArrowRight, Lock, Sparkles, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import scoutMapIllustration from "@/assets/scout-map-illustration.png";

const TEAL = "#5b5bd6";
const ACCENT_TEAL = "#a5a5f5";
const INK = "#0c0e1a";
const CREAM = "#f7f4ee";

export function ScoutSpotlightSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section style={{ background: CREAM, padding: "6rem 0" }}>
      <style>{`
        @keyframes scoutFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes scoutPulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
        @keyframes scoutShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes scoutFadeUp {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .scout-arrow-hover:hover .scout-arrow {
          transform: translateX(6px);
        }
      `}</style>

      <div className="container mx-auto px-4 relative" ref={ref}>
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: TEAL }}>
            One product · One promise
          </span>
          <h2 className="font-serif mt-4" style={{ fontSize: "clamp(2rem, 4.5vw, 3.4rem)", fontWeight: 500, color: INK, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
            Meet <em style={{ color: TEAL, fontWeight: 500 }}>Throuly Scout.</em>
          </h2>
          <p style={{ marginTop: "1rem", color: "#4a4d63", fontSize: "1rem", lineHeight: 1.6 }}>
            The private way to figure out what you can afford — before anyone tries to sell to you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[38%_1fr] gap-6 max-w-5xl mx-auto items-stretch">
          {/* LEFT COLUMN — Text content + sample result in a reduced card */}
          <div
            style={{
              position: "relative",
              borderRadius: 24,
              padding: "clamp(18px, 2.6vw, 28px)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(30px)",
              transition: "opacity 700ms ease-out, transform 700ms cubic-bezier(0.22,1,0.36,1)",
              overflow: "hidden",
              background: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(91,91,214,0.12)",
              boxShadow: "0 24px 60px -24px rgba(12,14,26,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: -40,
                right: -40,
                width: 140,
                height: 140,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${ACCENT_TEAL}22 0%, transparent 70%)`,
                filter: "blur(20px)",
                animation: "scoutFloat 6s ease-in-out infinite",
              }}
            />

            <div className="relative z-10">
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span
                  aria-hidden
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: TEAL,
                    animation: "scoutPulseDot 2s ease-in-out infinite",
                  }}
                />
                <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: TEAL }}>
                  Throuly Scout
                </span>
              </div>

              <h3 className="font-serif" style={{ fontSize: "clamp(1.5rem, 2.8vw, 2rem)", fontWeight: 600, color: INK, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 10 }}>
                Find & Qualify
              </h3>

              <p style={{ fontSize: "0.95rem", color: "#3a3d54", lineHeight: 1.5, fontWeight: 500, marginBottom: 6 }}>
                Search anonymously. Calculate affordability. Explore when ready.
              </p>
              <p style={{ fontSize: "0.85rem", color: "#5b5d72", lineHeight: 1.55, fontStyle: "italic", marginBottom: 18 }}>
                Find out exactly what you qualify for across all 50 states — without giving up your contact info.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                <Pill icon={<Lock className="w-3 h-3" />} label="100% Private" />
                <Pill icon={<MapPin className="w-3 h-3" />} label="All 50 States" />
                <Pill icon={<Sparkles className="w-3 h-3" />} label="AI-Powered" />
              </div>

              <Link
                to="/buyers"
                className="scout-arrow-hover inline-flex items-center gap-2 transition-all"
                style={{
                  background: INK,
                  color: CREAM,
                  padding: "12px 20px",
                  borderRadius: 10,
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 20,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = TEAL)}
                onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
              >
                Explore as Buyer
                <ArrowRight className="w-4 h-4 scout-arrow" style={{ transition: "transform 0.3s" }} />
              </Link>

              {/* Sample result card — compact, fills the left section */}
              <div
                style={{
                  width: "100%",
                  background: `linear-gradient(160deg, ${TEAL} 0%, #3f3fb0 100%)`,
                  borderRadius: 14,
                  padding: 18,
                  color: "white",
                  boxShadow: "0 16px 34px -14px rgba(91,91,214,0.35)",
                  animation: "scoutFadeUp 800ms cubic-bezier(0.22,1,0.36,1) both",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.8, marginBottom: 4 }}>
                      Sample Result
                    </div>
                    <div className="font-serif" style={{ fontSize: "clamp(1.4rem, 2.6vw, 1.9rem)", fontWeight: 400, lineHeight: 1, letterSpacing: "-0.02em" }}>
                      $412,000
                    </div>
                    <div style={{ fontSize: "0.72rem", opacity: 0.85, marginTop: 4 }}>
                      Estimated buying power · TX
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "0.72rem" }}>
                    <div style={{ opacity: 0.8 }}>Rate</div>
                    <div style={{ fontWeight: 700, color: ACCENT_TEAL }}>6.48%</div>
                    <div style={{ opacity: 0.8, marginTop: 6 }}>Down</div>
                    <div style={{ fontWeight: 700 }}>$40,000</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, fontSize: "0.65rem", opacity: 0.7, display: "flex", alignItems: "center", gap: 6 }}>
                  <Lock className="w-3 h-3" />
                  Contact info never shared
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — Map illustration blends into cream background */}
          <div
            className="min-h-[360px] md:min-h-full"
            style={{
              position: "relative",
              borderRadius: 24,
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(30px)",
              transition: "opacity 700ms ease-out 150ms, transform 700ms cubic-bezier(0.22,1,0.36,1) 150ms",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={scoutMapIllustration}
              alt="Coverage across all 50 US states"
              loading="lazy"
              width={1280}
              height={1024}
              className="pointer-events-none select-none relative z-10"
              style={{
                width: "100%",
                height: "100%",
                maxWidth: "none",
                objectFit: "contain",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(12px)",
                transition: "opacity 900ms ease-out 250ms, transform 900ms cubic-bezier(0.22,1,0.36,1) 250ms",
              }}
            />
          </div>
        </div>

      </div>
    </section>
  );
}

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 999,
        background: "rgba(91,91,214,0.08)",
        border: "1px solid rgba(91,91,214,0.2)",
        color: "#5b5bd6",
        fontSize: "0.72rem",
        fontWeight: 600,
      }}
    >
      {icon}
      {label}
    </span>
  );
}
