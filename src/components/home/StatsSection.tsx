import { useEffect, useRef, useState } from "react";

const stats = [
  { value: "50", suffix: "", label: "STATES COVERED", accent: "#818cf8" },
  { value: "2.4", suffix: "M+", label: "PROPERTIES ANALYZED", accent: "#5eead4" },
  { value: "0", suffix: "", label: "SPAM CALLS SENT", accent: "#fbbf24" },
  { value: "100", suffix: "%", label: "PRIVATE BY DEFAULT", accent: "#f472b6" },
];

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { threshold: 0.25 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #07091a 0%, #0d1028 55%, #14163a 100%)',
        padding: '7rem 0',
      }}
    >
      {/* Ambient glows */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-100px', left: '-100px', width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(91,91,214,0.25), transparent 70%)',
          filter: 'blur(30px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-120px', right: '-80px', width: '380px', height: '380px',
          background: 'radial-gradient(circle, rgba(94,234,212,0.15), transparent 70%)',
          filter: 'blur(30px)',
        }}
      />

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-14">
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#818cf8',
            }}
          >
            The numbers
          </span>
          <h2
            className="font-serif mt-4"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              fontWeight: 500,
              color: 'white',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            Real scale. <em style={{ color: '#a5b4fc', fontWeight: 400 }}>Real results.</em>
          </h2>
        </div>

        <div
          ref={ref}
          className="mx-auto grid grid-cols-2 md:grid-cols-4"
          style={{ maxWidth: '1100px', gap: '1px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', overflow: 'hidden' }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className="text-center relative group transition-all duration-700"
              style={{
                padding: '3rem 1.5rem',
                background: '#07091a',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: `${i * 100}ms`,
              }}
            >
              <div
                className="font-serif"
                style={{
                  fontSize: 'clamp(2.6rem, 5vw, 4.2rem)',
                  fontWeight: 300,
                  color: 'white',
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  marginBottom: '0.75rem',
                }}
              >
                {s.value}
                <span style={{ color: s.accent }}>{s.suffix}</span>
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.45)',
                  fontWeight: 600,
                }}
              >
                {s.label}
              </div>
              <div
                className="absolute left-1/2 -translate-x-1/2 transition-all duration-300 group-hover:w-16"
                style={{
                  bottom: '1.25rem',
                  width: '24px',
                  height: '2px',
                  background: s.accent,
                  borderRadius: '2px',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
