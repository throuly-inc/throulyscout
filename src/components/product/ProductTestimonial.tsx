import { Star, Quote } from "lucide-react";

export interface ProductTestimonialProps {
  quote: string;
  author: string;
  role: string;
  location: string;
  rating?: number;
  productColor?: string;
}

export function ProductTestimonial({
  quote,
  author,
  role,
  location,
  rating = 5,
  productColor = "#5b5bd6",
}: ProductTestimonialProps) {
  return (
    <section style={{ background: '#eeebe0', padding: '6rem 0' }}>
      <div className="container mx-auto px-4">
        <div className="max-w-[720px] mx-auto">
          {/* Card */}
          <div
            className="rounded-2xl p-8 md:p-12 relative"
            style={{
              background: '#f7f4ee',
              border: '1px solid rgba(12,14,26,0.08)',
              boxShadow: '0 8px 40px rgba(12,14,26,0.06)',
            }}
          >
            {/* Quote icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
              style={{ background: `${productColor}12` }}
            >
              <Quote className="w-5 h-5" style={{ color: productColor }} />
            </div>

            {/* Stars */}
            <div className="flex gap-1 mb-5">
              {[...Array(rating)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]"
                />
              ))}
            </div>

            {/* Quote text */}
            <blockquote
              className="font-serif italic mb-8"
              style={{
                fontSize: 'clamp(1.15rem, 2.2vw, 1.6rem)',
                fontWeight: 400,
                color: '#0c0e1a',
                lineHeight: 1.55,
              }}
            >
              &ldquo;{quote}&rdquo;
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-4">
              {/* Avatar placeholder */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: `${productColor}15`,
                  color: productColor,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                {author.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0c0e1a' }}>
                  {author}
                </p>
                <p style={{ fontSize: '0.78rem', color: '#787a92' }}>
                  {role}
                </p>
                <p style={{ fontSize: '0.72rem', color: productColor, fontWeight: 500 }}>
                  {location}
                </p>
              </div>
            </div>
          </div>

          {/* Eyebrow label */}
          <p
            className="text-center mt-8"
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#787a92',
            }}
          >
            Happy Customer
          </p>
        </div>
      </div>
    </section>
  );
}
