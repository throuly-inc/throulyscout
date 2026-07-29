import { useEffect, useRef, useState } from "react";
import { Shield, FileCheck2, Sparkles } from "lucide-react";

const PURPLE = "#5B4FE5";
const GREEN = "#5A8A6B";
const INK = "#0c0e1a";
const CREAM = "#F5F2ED";

type Pillar = {
  icon: React.ReactNode;
  accent: string;
  title: string;
  body: string;
  caption: string;
};

const pillars: Pillar[] = [
  {
    icon: <Shield className="w-7 h-7" strokeWidth={2} />,
    accent: PURPLE,
    title: "Private by Default",
    body: "Explore, calculate, and prepare without giving up your contact information.",
    caption: "You stay in control",
  },
  {
    icon: <FileCheck2 className="w-7 h-7" strokeWidth={2} />,
    accent: GREEN,
    title: "Truth Before Pressure",
    body: "Get clear guidance on what you qualify for before anyone tries to sell to you.",
    caption: "No spam. No surprises.",
  },
  {
    icon: <Sparkles className="w-7 h-7" strokeWidth={2} />,
    accent: PURPLE,
    title: "Smarter Real Estate",
    body: "AI-powered tools help buyers make cleaner decisions.",
    caption: "Built for clarity",
  },
];

export function PillarsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          pillars.forEach((_, i) =>
            setTimeout(
              () =>
                setVisible((v) => {
                  const n = [...v];
                  n[i] = true;
                  return n;
                }),
              120 + i * 180
            )
          );
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section style={{ background: CREAM, padding: "6rem 0" }}>
      <div className="container mx-auto px-4" ref={ref}>
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: PURPLE,
            }}
          >
            The Throuly promise
          </span>
          <h2
            className="font-serif mt-4"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(2rem, 4.5vw, 3.4rem)",
              fontWeight: 500,
              color: INK,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            Three ways we do things{" "}
            <em style={{ color: PURPLE, fontWeight: 500 }}>differently.</em>
          </h2>
          <p
            style={{
              marginTop: "1rem",
              color: "#4a4d63",
              fontSize: "1rem",
              lineHeight: 1.6,
            }}
          >
            Built for buyers who want clarity before commitment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
          {pillars.map((p, i) => {
            const shown = visible[i];
            return (
              <article
                key={i}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 22,
                  padding: "30px 28px",
                  border: "1px solid rgba(12,14,26,0.06)",
                  boxShadow:
                    "0 2px 4px rgba(12,14,26,0.04), 0 20px 40px rgba(12,14,26,0.08), 0 48px 80px rgba(12,14,26,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  opacity: shown ? 1 : 0,
                  transform: shown ? "translateY(0)" : "translateY(20px)",
                  transition: "all 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 14,
                    background: `${p.accent}12`,
                    color: p.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  {p.icon}
                </div>
                <h3
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "1.35rem",
                    fontWeight: 700,
                    color: INK,
                    marginBottom: 10,
                    lineHeight: 1.25,
                  }}
                >
                  {p.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "#4a4d63",
                    lineHeight: 1.6,
                    marginBottom: 18,
                    flex: 1,
                  }}
                >
                  {p.body}
                </p>
                <div
                  style={{
                    width: 44,
                    height: 2.5,
                    background: p.accent,
                    borderRadius: 2,
                    marginBottom: 10,
                  }}
                />
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: p.accent,
                    letterSpacing: "0.03em",
                  }}
                >
                  {p.caption}
                </span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
