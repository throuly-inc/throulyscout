import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type Pillar = {
  key: string;
  label: string;
  accent: string;
  other: string[];
  throuly: string[];
};

const pillars: Pillar[] = [
  {
    key: "privacy",
    label: "Privacy",
    accent: "#5B4FE5",
    other: [
      "Enter your info just to see a price.",
      "Sold to 5+ lenders within a day.",
      "Spam calls start immediately.",
    ],
    throuly: [
      "0 data brokers.",
      "Browse and calculate anonymously.",
      "You choose when to connect.",
    ],
  },
  {
    key: "ai",
    label: "AI Insights",
    accent: "#0284c7",
    other: [
      "Generic national averages.",
      "No idea what you actually qualify for.",
      "Guesswork until you call a lender.",
    ],
    throuly: [
      "State-specific affordability, instantly.",
      "Compare rental yields across all 50 states.",
      "Know what you qualify for before you call.",
    ],
  },
  {
    key: "transparency",
    label: "Clarity",
    accent: "#5A8A6B",
    other: [
      "Vague estimates that don't match reality.",
      "You find out you don't qualify after applying.",
      "Hidden closing costs surprise you at the end.",
    ],
    throuly: [
      "Real DTI, PMI, taxes, and insurance — line by line.",
      "Know your qualifying number before you shop.",
      "Full closing-cost breakdown up front.",
    ],
  },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export function ValuePropsSection() {
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState<boolean[]>([false, false, false]);
  const [inView, setInView] = useState(false);
  const [hoverRow, setHoverRow] = useState<number | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          pillars.forEach((_, i) => {
            setTimeout(
              () =>
                setVisible((v) => {
                  const n = [...v];
                  n[i] = true;
                  return n;
                }),
              reduced ? 0 : 200 + i * 160
            );
          });
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, [reduced]);

  const throulyBg =
    "linear-gradient(180deg, rgba(91,79,229,0.07), rgba(90,138,107,0.09))";
  const throulyBgHover =
    "linear-gradient(180deg, rgba(91,79,229,0.12), rgba(90,138,107,0.14))";
  const otherBg = "rgba(12,14,26,0.035)";
  const otherBgHover = "rgba(12,14,26,0.06)";

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ background: "#eeebe0", padding: "8rem 0" }}
    >
      <style>{`
        @keyframes vpRowIn {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes vpIconIn {
          0% { opacity: 0; transform: scale(0.4); }
          60% { opacity: 1; }
          100% { opacity: 1; transform: scale(1); }
        }
        .vp-row-anim {
          animation: vpRowIn 700ms ${EASE} both;
        }
        .vp-icon-anim {
          animation: vpIconIn 500ms ${EASE} both;
        }
        @media (prefers-reduced-motion: reduce) {
          .vp-row-anim, .vp-icon-anim { animation: none !important; }
        }
      `}</style>

      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-3 mb-6"
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "#5B4FE5",
              }}
            >
              <span style={{ width: 28, height: 1, background: "#5B4FE5" }} />
              Why Throuly
            </div>
            <h2
              className="font-serif"
              style={{
                fontSize: "clamp(2.2rem, 4.5vw, 3.6rem)",
                fontWeight: 500,
                color: "#0c0e1a",
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
              }}
            >
              A different kind of real estate platform —
              <br />
              <span
                style={{
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: "#5B4FE5",
                }}
              >
                built for you.
              </span>
            </h2>
            <p
              style={{
                marginTop: "1.25rem",
                color: "#5b5d72",
                fontSize: "1rem",
                lineHeight: 1.6,
              }}
            >
              See how we stack up — side by side.
            </p>
          </div>

          {/* Mobile: stacked cards */}
          <div className="md:hidden flex flex-col" style={{ gap: 18 }}>
            {pillars.map((p, i) => {
              const shown = visible[i];
              return (
                <article
                  key={p.key}
                  className={shown ? "vp-row-anim" : ""}
                  style={{
                    opacity: shown || reduced ? 1 : 0,
                    borderRadius: 18,
                    overflow: "hidden",
                    border: `1px solid ${p.accent}33`,
                    background: "#fdfcf7",
                    boxShadow: "0 1px 2px rgba(12,14,26,0.04)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px 10px" }}>
                    <span aria-hidden style={{ width: 4, height: 20, background: p.accent, borderRadius: 3 }} />
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: p.accent }}>
                      {p.label}
                    </span>
                  </div>

                  <div style={{ background: otherBg, padding: "12px 16px", borderTop: "1px solid rgba(12,14,26,0.06)" }}>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#4a4d63", marginBottom: 8 }}>
                      Other Sites
                    </div>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                      {p.other.map((line, j) => (
                        <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.95rem", lineHeight: 1.5, color: "#3a3d54", fontWeight: 500 }}>
                          <span aria-hidden style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: 999, background: "rgba(12,14,26,0.08)", marginTop: 2 }}>
                            <X style={{ width: 10, height: 10, color: "#6b6d82" }} strokeWidth={2.5} />
                          </span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ height: 1, background: `${p.accent}22` }} />

                  <div style={{ background: throulyBg, padding: "14px 16px 16px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#5B4FE5", background: "rgba(91,79,229,0.12)", padding: "3px 9px", borderRadius: 999, marginBottom: 10 }}>
                      <span style={{ width: 5, height: 5, borderRadius: 999, background: "#5B4FE5" }} />
                      Throuly
                    </div>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                      {p.throuly.map((line, j) => (
                        <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.95rem", lineHeight: 1.5, color: "#0c0e1a", fontWeight: 500 }}>
                          <span aria-hidden style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: 999, background: `${p.accent}22`, border: `1px solid ${p.accent}40`, marginTop: 2 }}>
                            <Check style={{ width: 12, height: 12, color: p.accent }} strokeWidth={3} />
                          </span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Desktop table */}
          <div
            className="hidden md:block md:overflow-visible"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <table
              style={{
                width: "100%",
                minWidth: "680px",
                borderCollapse: "separate",
                borderSpacing: 0,
                tableLayout: "fixed",
              }}
            >
              <caption className="sr-only">
                Comparison of Other Sites and Throuly across Privacy, AI
                Insights, and Transparency.
              </caption>
              <colgroup>
                <col style={{ width: "180px" }} />
                <col />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th
                    scope="col"
                    style={{
                      background: "#eeebe0",
                      position: "sticky",
                      left: 0,
                      zIndex: 2,
                    }}
                  />
                  <th
                    scope="col"
                    style={{
                      padding: "1rem 1.5rem",
                      textAlign: "left",
                      background: otherBg,
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                      border: "1px solid rgba(12,14,26,0.08)",
                      borderBottom: "none",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "#4a4d63",
                        marginBottom: 4,
                      }}
                    >
                      The usual
                    </div>
                    <div
                      className="font-serif"
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 500,
                        color: "#0c0e1a",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Other Sites
                    </div>
                  </th>
                  <th
                    scope="col"
                    style={{
                      padding: "1rem 1.5rem",
                      textAlign: "left",
                      background: throulyBg,
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                      border: "1px solid rgba(91,79,229,0.22)",
                      borderBottom: "none",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "#5B4FE5",
                        background: "rgba(91,79,229,0.12)",
                        padding: "3px 10px",
                        borderRadius: 999,
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 999,
                          background: "#5B4FE5",
                        }}
                      />
                      Throuly Way
                    </div>
                    <div
                      className="font-serif"
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 500,
                        color: "#0c0e1a",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Throuly
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pillars.map((p, i) => {
                  const isHover = hoverRow === i;
                  const shown = visible[i];
                  return (
                    <tr
                      key={p.key}
                      onMouseEnter={() => setHoverRow(i)}
                      onMouseLeave={() => setHoverRow(null)}
                      className={shown ? "vp-row-anim" : ""}
                      style={{
                        opacity: shown || reduced ? 1 : 0,
                        animationDelay: `${i * 40}ms`,
                      }}
                    >
                      {/* Row label */}
                      <th
                        scope="row"
                        style={{
                          padding: "1.75rem 1.25rem 1.75rem 1rem",
                          textAlign: "left",
                          verticalAlign: "top",
                          background: "#eeebe0",
                          position: "sticky",
                          left: 0,
                          zIndex: 1,
                          borderTop: i === 0 ? "none" : "1px solid rgba(12,14,26,0.08)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <span
                            aria-hidden
                            style={{
                              display: "block",
                              width: isHover ? 5 : 3,
                              height: 28,
                              background: p.accent,
                              borderRadius: 3,
                              transition: `width 300ms ${EASE}`,
                            }}
                          />
                          <span
                            style={{
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              letterSpacing: "0.18em",
                              textTransform: "uppercase",
                              color: p.accent,
                            }}
                          >
                            {p.label}
                          </span>
                        </div>
                      </th>

                      {/* Other Sites */}
                      <td
                        style={{
                          padding: "1.75rem 1.5rem",
                          verticalAlign: "top",
                          background: isHover ? otherBgHover : otherBg,
                          borderLeft: "1px solid rgba(12,14,26,0.08)",
                          borderRight: "1px solid rgba(12,14,26,0.08)",
                          borderTop: "1px solid rgba(12,14,26,0.06)",
                          transition: `background 300ms ${EASE}`,
                        }}
                      >
                        <ul
                          style={{
                            listStyle: "none",
                            margin: 0,
                            padding: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.85rem",
                          }}
                        >
                          {p.other.map((line, j) => (
                            <li
                              key={j}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "0.7rem",
                                fontSize: "0.98rem",
                                lineHeight: 1.55,
                                color: "#3a3d54",
                                fontWeight: 500,
                              }}
                            >
                              <span
                                aria-hidden
                                className={shown ? "vp-icon-anim" : ""}
                                style={{
                                  flexShrink: 0,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 22,
                                  height: 22,
                                  borderRadius: 999,
                                  background: "rgba(12,14,26,0.06)",
                                  border: "1px solid rgba(12,14,26,0.1)",
                                  marginTop: 2,
                                  opacity: shown || reduced ? 1 : 0,
                                  animationDelay: `${i * 160 + j * 80 + 250}ms`,
                                }}
                              >
                                <X
                                  style={{ width: 12, height: 12, color: "#6b6d82" }}
                                  strokeWidth={2.5}
                                />
                              </span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </td>

                      {/* Throuly */}
                      <td
                        style={{
                          padding: "1.75rem 1.5rem",
                          verticalAlign: "top",
                          background: isHover ? throulyBgHover : throulyBg,
                          borderLeft: "1px solid rgba(91,79,229,0.22)",
                          borderRight: "1px solid rgba(91,79,229,0.22)",
                          borderTop: "1px solid rgba(91,79,229,0.15)",
                          boxShadow: isHover
                            ? `inset 0 0 0 1px ${p.accent}44`
                            : "none",
                          transition: `background 300ms ${EASE}, box-shadow 300ms ${EASE}`,
                        }}
                      >
                        <ul
                          style={{
                            listStyle: "none",
                            margin: 0,
                            padding: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.85rem",
                          }}
                        >
                          {p.throuly.map((line, j) => (
                            <li
                              key={j}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "0.7rem",
                                fontSize: "0.98rem",
                                lineHeight: 1.55,
                                color: "#0c0e1a",
                                fontWeight: 500,
                              }}
                            >
                              <span
                                aria-hidden
                                className={shown ? "vp-icon-anim" : ""}
                                style={{
                                  flexShrink: 0,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 22,
                                  height: 22,
                                  borderRadius: 999,
                                  background: `${p.accent}22`,
                                  border: `1px solid ${p.accent}40`,
                                  marginTop: 2,
                                  opacity: shown || reduced ? 1 : 0,
                                  animationDelay: `${i * 160 + j * 80 + 350}ms`,
                                }}
                              >
                                <Check
                                  style={{ width: 13, height: 13, color: p.accent }}
                                  strokeWidth={3}
                                />
                              </span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  );
                })}
                {/* Bottom rounded corners */}
                <tr aria-hidden>
                  <td style={{ background: "#eeebe0" }} />
                  <td
                    style={{
                      background: otherBg,
                      height: 12,
                      border: "1px solid rgba(12,14,26,0.08)",
                      borderTop: "1px solid rgba(12,14,26,0.06)",
                      borderBottomLeftRadius: 16,
                      borderBottomRightRadius: 16,
                    }}
                  />
                  <td
                    style={{
                      background: throulyBg,
                      height: 12,
                      border: "1px solid rgba(91,79,229,0.22)",
                      borderTop: "1px solid rgba(91,79,229,0.15)",
                      borderBottomLeftRadius: 16,
                      borderBottomRightRadius: 16,
                    }}
                  />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Silence unused var lint if any */}
      <span hidden>{String(inView)}</span>
    </section>
  );
}
