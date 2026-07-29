import { Link } from "react-router-dom";

interface ProductHeroProps {
  bgColor: string;
  glowColor: string;
  eyebrow: string;
  eyebrowColor: string;
  eyebrowBg: string;
  eyebrowBorder: string;
  headline: React.ReactNode;
  body: string;
  features: string[];
  primaryLabel: string;
  primaryBg: string;
  primaryColor: string;
  ghostLabel: string;
  trustNote: string;
  mockContent: React.ReactNode;
  primaryHref?: string;
}

export function ProductHero({
  bgColor,
  glowColor,
  eyebrow,
  eyebrowColor,
  eyebrowBg,
  eyebrowBorder,
  headline,
  body,
  features,
  primaryLabel,
  primaryBg,
  primaryColor,
  ghostLabel,
  trustNote,
  mockContent,
  primaryHref,
}: ProductHeroProps) {
  return (
    <section
      className="relative pt-20 overflow-hidden py-12 md:py-20"
      style={{ background: bgColor }}
    >
      {/* Glow orb */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          maxWidth: '90vw',
          maxHeight: '90vw',
          borderRadius: '50%',
          background: glowColor,
          filter: 'blur(100px)',
        }}
      />

      <div className="max-w-[1200px] mx-auto px-4 relative z-10">
        <div className="grid gap-10 items-center grid-cols-1 md:grid-cols-2">
          {/* LEFT — Mock UI (shows second on mobile, first on desktop) */}
          <div className="flex items-center justify-center order-2 md:order-1 w-full">
            {mockContent}
          </div>

          {/* RIGHT — Text */}
          <div className="flex flex-col gap-6 md:pt-8 order-1 md:order-2">
            {/* Eyebrow */}
            <span
              className="inline-block self-start"
              style={{
                fontSize: '0.64rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: eyebrowColor,
                background: eyebrowBg,
                border: `1px solid ${eyebrowBorder}`,
                borderRadius: '100px',
                padding: '5px 14px',
              }}
            >
              {eyebrow}
            </span>

            {/* Headline */}
            <h1
              className="font-serif"
              style={{
                fontSize: 'clamp(2.5rem, 4.5vw, 4rem)',
                fontWeight: 300,
                color: 'white',
                lineHeight: 1.05,
              }}
            >
              {headline}
            </h1>

            {/* Body */}
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.48)', lineHeight: 1.85 }}>
              {body}
            </p>

            {/* Feature list */}
            <div className="flex flex-col">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3"
                  style={{
                    padding: '0.65rem 0',
                    borderBottom: i < features.length - 1 ? '1px solid rgba(255,255,255,0.06)' : undefined,
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>→</span>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 mt-2">
              {primaryHref ? (
                <Link
                  to={primaryHref}
                  className="transition-all duration-200 animate-cta-bounce"
                  style={{
                    background: primaryBg,
                    color: primaryColor,
                    fontWeight: 700,
                    padding: '12px 28px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                  }}
                >
                  {primaryLabel}
                </Link>
              ) : (
                <button
                  className="transition-all duration-200 animate-cta-bounce"
                  style={{
                    background: primaryBg,
                    color: primaryColor,
                    fontWeight: 700,
                    padding: '12px 28px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                  }}
                >
                  {primaryLabel}
                </button>
              )}
              <button
                className="transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.65)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  fontWeight: 600,
                  padding: '12px 28px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                }}
              >
                {ghostLabel}
              </button>
            </div>

            {/* Trust */}
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>
              {trustNote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
