import { forwardRef, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import hiwAnswer from "@/assets/hiw-answer.png";
import hiwResults from "@/assets/hiw-results.png";
import hiwExplore from "@/assets/hiw-explore.png";
import hiwTrack from "@/assets/hiw-track.png";

const ACCENT = "#5b5bd6";
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const steps = [
  {
    image: hiwAnswer,
    title: "Answer Questions",
    description: "Tell us about your finances, preferences, and goals — privately.",
  },
  {
    image: hiwResults,
    title: "Get Personalized Results",
    description: "See what you need for down payment, closing costs, and monthly payments across all 50 states.",
  },
  {
    image: hiwExplore,
    title: "Explore & Compare",
    description: "Save scenarios, compare states side-by-side, and run what-ifs — no spam calls, ever.",
  },
  {
    image: hiwTrack,
    title: "Track Your Progress",
    description: "Follow a personalized roadmap from savings goals to closing-ready — auto-updated as you go.",
  },
];

export const HowItWorksSection = forwardRef<HTMLElement>((props, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={(el) => {
        sectionRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
      style={{ background: "#f7f4ee", padding: "6rem 0" }}
    >
      <style>{`
        @keyframes hiwFadeUp {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .hiw-item { transition: transform .35s ${EASE}; }
        .hiw-item:hover { transform: translateY(-6px); }
        @media (prefers-reduced-motion: reduce) {
          .hiw-anim { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span
            className="inline-block mb-5"
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              textTransform: "uppercase",
              color: ACCENT,
              letterSpacing: "0.22em",
            }}
          >
            Built for Buyers | Your Journey
          </span>
          <h2
            className="font-serif mb-4"
            style={{
              fontSize: "clamp(2.2rem, 4.6vw, 3.6rem)",
              fontWeight: 600,
              color: "#0c0e1a",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            Four steps to <em style={{ color: ACCENT, fontWeight: 500 }}>success</em>.
          </h2>
          <p
            className="font-serif mb-4"
            style={{
              fontSize: "clamp(1.1rem, 1.8vw, 1.4rem)",
              fontWeight: 500,
              color: "#0c0e1a",
              letterSpacing: "-0.01em",
            }}
          >
            Calculate. <em style={{ color: ACCENT, fontWeight: 500 }}>Compare.</em> Close.
          </p>
          <p style={{ fontSize: "1rem", color: "#4a4d63", lineHeight: 1.6, fontWeight: 500 }}>
            Your journey to real estate confidence starts with four simple steps — with insights across all 50 states.
          </p>
        </div>

        {/* Steps row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12 max-w-6xl mx-auto mb-14">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`hiw-item ${isVisible ? "hiw-anim" : ""}`}
              style={{
                textAlign: "center",
                opacity: isVisible ? 1 : 0,
                animation: isVisible ? `hiwFadeUp 700ms ${EASE} ${i * 120}ms both` : "none",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 200,
                  aspectRatio: "1 / 1",
                  margin: "0 auto 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={step.image}
                  alt={step.title}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>
              <h3
                className="font-serif"
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  color: "#0c0e1a",
                  lineHeight: 1.35,
                  maxWidth: 220,
                  margin: "0 auto",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: "#3a3d54",
                  lineHeight: 1.55,
                  fontWeight: 500,
                  marginTop: 8,
                  maxWidth: 240,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/buyers">
            <button
              className="transition-all duration-200"
              style={{
                background: "#0c0e1a",
                color: "#f7f4ee",
                fontSize: "0.9rem",
                fontWeight: 600,
                padding: "14px 34px",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#0c0e1a")}
            >
              Start Your Journey <span className="ml-1">→</span>
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
});

HowItWorksSection.displayName = "HowItWorksSection";
