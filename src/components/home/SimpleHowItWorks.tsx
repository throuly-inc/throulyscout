import { Link } from "react-router-dom";
import { ClipboardList, Calculator, Users, CheckCircle, ArrowRight } from "lucide-react";

const phases = [
  { num: "01", title: "Discover", text: "Tell us about your buying goals." },
  { num: "02", title: "Explore", text: "Use our tools privately, with zero commitment." },
  { num: "03", title: "Prepare", text: "Get roadmap-ready for your first purchase." },
];

const stepCards = [
  {
    num: 1,
    icon: ClipboardList,
    title: "Answer Questions",
    text: "Tell us about your financial situation, property preferences, and goals.",
  },
  {
    num: 2,
    icon: Calculator,
    title: "Get Personalized Results",
    text: "See exactly what you need for down payments, closing costs, and monthly payments across all 50 states.",
  },
  {
    num: 3,
    icon: CheckCircle,
    title: "Save & Track",
    text: "Save your scenarios and follow a step-by-step roadmap to home purchase readiness.",
  },
];


export function SimpleHowItWorks() {
  return (
    <section style={{ background: '#f7f4ee', padding: '7rem 0' }}>
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="flex items-center gap-4 mb-4">
          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#a8aac0', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
            Simple Process
          </span>
          <div className="flex-grow" style={{ height: '1px', background: 'rgba(12,14,26,0.06)' }} />
        </div>
        <h2
          className="font-serif mb-16"
          style={{
            fontSize: 'clamp(2.2rem, 4vw, 3.5rem)',
            fontWeight: 400,
            color: '#0c0e1a',
          }}
        >
          How It Works
        </h2>

        {/* Three-phase overview */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-0 mb-16"
          style={{ borderTop: '1px solid rgba(12,14,26,0.06)' }}
        >
          {phases.map((p, i) => (
            <div
              key={i}
              className="py-8 px-6"
              style={{
                borderRight: i < 2 ? '1px solid rgba(12,14,26,0.06)' : 'none',
              }}
            >
              <span className="font-serif block mb-3 select-none" style={{ fontSize: '4rem', fontWeight: 300, color: 'rgba(12,14,26,0.06)' }}>
                {p.num}
              </span>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0c0e1a', marginBottom: '0.5rem' }}>
                {p.title}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#4a4d63' }}>
                {p.text}
              </p>
            </div>
          ))}
        </div>

        {/* Step cards - 2x2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto mb-12">
          {stepCards.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="relative"
                style={{
                  background: '#eeebe0',
                  border: '1px solid rgba(12,14,26,0.06)',
                  borderRadius: '14px',
                  padding: '2rem 1.75rem',
                }}
              >
                {/* Number badge */}
                <div
                  className="absolute flex items-center justify-center"
                  style={{
                    top: '-10px',
                    left: '20px',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: '#0c0e1a',
                    color: '#f7f4ee',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                  }}
                >
                  {s.num}
                </div>
                {/* Icon */}
                <div
                  className="flex items-center justify-center mb-4"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: '#f7f4ee',
                    border: '1px solid rgba(12,14,26,0.06)',
                  }}
                >
                  <Icon style={{ width: '22px', height: '22px', color: '#0c0e1a' }} />
                </div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0c0e1a', marginBottom: '0.5rem' }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#4a4d63', lineHeight: 1.7 }}>
                  {s.text}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/buyers">
            <button
              className="transition-all duration-200"
              style={{
                background: '#0c0e1a',
                color: '#f7f4ee',
                fontSize: '0.82rem',
                fontWeight: 600,
                padding: '12px 28px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#5b5bd6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#0c0e1a')}
            >
              Start Your Journey <span className="ml-1">→</span>
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
