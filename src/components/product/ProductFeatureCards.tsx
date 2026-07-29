interface FeatureCard {
  icon: string;
  title: string;
  body: string;
}

interface ProductFeatureCardsProps {
  eyebrow: string;
  headline: string;
  cards: FeatureCard[];
}

export function ProductFeatureCards({ eyebrow, headline, cards }: ProductFeatureCardsProps) {
  return (
    <section style={{ background: '#eeebe0', padding: '5rem 0' }}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-3">
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#a8aac0',
              whiteSpace: 'nowrap',
            }}
          >
            {eyebrow}
          </span>
          <div className="flex-grow" style={{ height: '1px', background: 'rgba(12,14,26,0.06)' }} />
        </div>
        <h2
          className="font-serif mb-10"
          style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 500, color: '#0c0e1a' }}
        >
          {headline}
        </h2>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <div
              key={i}
              className="transition-all duration-300 hover:shadow-lg"
              style={{
                background: '#f7f4ee',
                border: '1px solid rgba(12,14,26,0.06)',
                borderRadius: '10px',
                padding: '2rem',
              }}
            >
              <span className="text-2xl mb-4 block">{card.icon}</span>
              <h3
                className="font-serif mb-2"
                style={{ fontSize: '1.15rem', fontWeight: 600, color: '#0c0e1a' }}
              >
                {card.title}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#787a92', lineHeight: 1.7 }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
