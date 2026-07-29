interface ProductCTABandProps {
  headline: string;
  sub: string;
  buttonLabel: string;
  glowColor: string;
}

export function ProductCTABand({ headline, sub, buttonLabel, glowColor }: ProductCTABandProps) {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0c0f3d 0%, #141870 100%)',
        padding: '5rem 0',
      }}
    >
      {/* Glow orb */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-20%',
          right: '10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: glowColor,
          filter: 'blur(120px)',
        }}
      />

      <div className="container mx-auto px-4 relative z-10 text-center max-w-2xl">
        <h2
          className="font-serif mb-4"
          style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 400, color: 'white' }}
        >
          {headline}
        </h2>
        <p className="mb-8" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.38)' }}>
          {sub}
        </p>
        <button
          className="transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: 'white',
            color: '#07091a',
            fontWeight: 700,
            padding: '14px 32px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(255,255,255,0.12)',
            fontSize: '0.85rem',
          }}
        >
          {buttonLabel}
        </button>
      </div>
    </section>
  );
}
