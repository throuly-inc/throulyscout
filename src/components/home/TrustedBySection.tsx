const badges = [
  "All 50 States",
  "Conventional · FHA · VA · USDA",
  "Real-Time Mortgage Rates",
  "Down-Payment Assistance",
  "Private by Default",
  "No Data Brokers",
  "State-Specific Tax & Insurance",
  "Instant Qualifying Estimates",
];

export function TrustedBySection() {
  const loop = [...badges, ...badges];

  return (
    <section
      style={{
        background: '#f7f4ee',
        padding: '4rem 0',
        borderTop: '1px solid rgba(12,14,26,0.06)',
        borderBottom: '1px solid rgba(12,14,26,0.06)',
      }}
    >
      <div className="text-center mb-8 px-4">
        <span
          style={{
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#5b5bd6',
          }}
        >
          Built for buyers · Trusted nationwide
        </span>
      </div>

      <div className="marquee-mask overflow-hidden">
        <div className="marquee-track" style={{ gap: '3rem', paddingRight: '3rem' }}>
          {loop.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="shrink-0"
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
                color: '#0c0e1a',
                opacity: 0.72,
                whiteSpace: 'nowrap',
                padding: '8px 18px',
                border: '1px solid rgba(12,14,26,0.1)',
                borderRadius: '999px',
                background: '#fdfcf7',
              }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
