import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Clock, MapPin, BadgeCheck } from "lucide-react";
import { clearActiveBuyerSession } from "@/lib/buyerSessionStorage";

const INK = "#0c0e1a";
const CREAM = "#f7f4ee";
const RING_BG = "rgba(12, 14, 26, 0.08)";

type Stat = {
  value: string;
  numeric: number; // percent of ring to fill (0-100)
  caption: string;
  color: string;
  Icon: typeof Search;
};

const stats: Stat[] = [
  {
    value: "55%",
    numeric: 55,
    caption:
      "of U.S. consumers think getting a mortgage is easy — the reality is more complex.",
    color: "#5b5bd6",
    Icon: Search,
  },
  {
    value: "~5 min",
    numeric: 85,
    caption: "to a personalized affordability estimate — no signup required.",
    color: "#e8a87c",
    Icon: Clock,
  },
  {
    value: "50",
    numeric: 100,
    caption: "states covered with real local taxes, insurance, and interest rates.",
    color: "#7d9b76",
    Icon: MapPin,
  },
  {
    value: "100%",
    numeric: 100,
    caption: "Free to view your results — no credit card, no signup.",
    color: INK,
    Icon: BadgeCheck,
  },
];

const SIZE = 176;
const STROKE = 13;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

function Donut({ stat, active, delay }: { stat: Stat; active: boolean; delay: number }) {
  const offset = active ? CIRC * (1 - stat.numeric / 100) : CIRC;
  const { Icon } = stat;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: SIZE, height: SIZE, margin: "0 auto" }}>
        <svg width={SIZE} height={SIZE} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke={RING_BG} strokeWidth={STROKE} />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={stat.color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            style={{
              transition: `stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
            }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Icon size={26} color={stat.color} strokeWidth={2} />
          <div
            className="font-serif"
            style={{
              fontSize: "1.9rem",
              fontWeight: 600,
              color: INK,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {stat.value}
          </div>
        </div>
      </div>
      <p
        style={{
          marginTop: "1.25rem",
          fontSize: "0.95rem",
          color: INK,
          fontWeight: 600,
          lineHeight: 1.5,
          maxWidth: 280,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {stat.caption}
      </p>
    </div>
  );
}

export function HowItWorksMetrics() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setActive(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        background: CREAM,
        borderTop: "1px solid rgba(12, 14, 26, 0.08)",
        borderBottom: "1px solid rgba(12, 14, 26, 0.08)",
        padding: "4rem 0",
        margin: "1rem 0",
      }}
    >
      <h3
        className="font-serif"
        style={{
          fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
          fontWeight: 600,
          color: INK,
          textAlign: "center",
          letterSpacing: "-0.02em",
          marginBottom: "3rem",
        }}
      >
        Why buyers start <em style={{ color: "#5b5bd6", fontWeight: 500 }}>here</em>.
      </h3>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-6xl mx-auto px-4"
      >
        {stats.map((s, i) => (
          <Donut key={s.value} stat={s} active={active} delay={i * 160} />
        ))}
      </div>

      <p
        style={{
          textAlign: "center",
          marginTop: "2.5rem",
          fontSize: "0.8rem",
          color: "rgba(12, 14, 26, 0.55)",
          fontWeight: 500,
          padding: "0 1rem",
        }}
      >
        Source: Fannie Mae Mortgage Understanding Study, 2024.
      </p>

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <Link to="/buyers" onClick={clearActiveBuyerSession}>
          <button
            className="transition-all duration-200"
            style={{
              background: INK,
              color: CREAM,
              fontSize: "0.9rem",
              fontWeight: 600,
              padding: "13px 32px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#5b5bd6")}
            onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
          >
            Start now <span className="ml-1">→</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
