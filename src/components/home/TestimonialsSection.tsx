import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Throuly Scout showed me exactly what I could afford across different states — I found my dream home in Texas within weeks and never once got a spam call.",
    author: "Sarah Mitchell",
    role: "First-Time Homebuyer",
    location: "Austin, TX",
    rating: 5,
    accent: "#5b5bd6",
  },
  {
    quote:
      "I compared buying power in five states in one afternoon. No pushy lenders, no gimmicks — just real numbers I could act on.",
    author: "David Thompson",
    role: "Relocating Homebuyer",
    location: "Denver, CO",
    rating: 5,
    accent: "#e8a87c",
  },
  {
    quote:
      "The state-by-state breakdown made it easy to compare markets and find the right fit for my family. Scout is now the first tab I open every morning.",
    author: "Priya Patel",
    role: "Home Buyer",
    location: "Charlotte, NC",
    rating: 5,
    accent: "#7d9b76",
  },
  {
    quote:
      "Scout's affordability engine matched what our lender quoted almost to the dollar. We walked into pre-approval already knowing our number.",
    author: "Mark & Lisa Johnson",
    role: "First-Time Buyers",
    location: "Scottsdale, AZ",
    rating: 5,
    accent: "#c45c7c",
  },
];

const badges = ["50 States Covered", "100% Private", "Real-Time Updates"];

export function TestimonialsSection() {
  return (
    <section style={{ background: "#f7f4ee", padding: "7rem 0", overflow: "hidden" }}>
      <style>{`
        @keyframes tFloatA { 0%,100% { transform: translateY(0) rotate(-1.2deg);} 50% { transform: translateY(-14px) rotate(-1.2deg);} }
        @keyframes tFloatB { 0%,100% { transform: translateY(0) rotate(1.4deg);} 50% { transform: translateY(-18px) rotate(1.4deg);} }
        @keyframes tFloatC { 0%,100% { transform: translateY(0) rotate(-0.6deg);} 50% { transform: translateY(-10px) rotate(-0.6deg);} }
        @keyframes tFloatD { 0%,100% { transform: translateY(0) rotate(1deg);} 50% { transform: translateY(-16px) rotate(1deg);} }
        @keyframes tFadeIn { 0% { opacity:0; transform: translateY(30px) scale(.96);} 100% { opacity:1; transform: translateY(0) scale(1);} }
        .t-card { animation: tFadeIn .8s cubic-bezier(.22,1,.36,1) both; transition: transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s; }
        .t-card:hover { transform: translateY(-8px) rotate(0deg) scale(1.02) !important; box-shadow: 0 40px 80px -20px rgba(12,14,26,0.25) !important; z-index: 10; }
        .t-inner-a { animation: tFloatA 7s ease-in-out infinite; }
        .t-inner-b { animation: tFloatB 8s ease-in-out infinite .5s; }
        .t-inner-c { animation: tFloatC 9s ease-in-out infinite 1s; }
        .t-inner-d { animation: tFloatD 7.5s ease-in-out infinite 1.5s; }
      `}</style>

      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#5b5bd6" }}>
            Real Buyers · Real Results
          </span>
          <h2 className="font-serif mt-4" style={{ fontSize: "clamp(2rem, 4.5vw, 3.4rem)", fontWeight: 500, color: "#0c0e1a", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
            Loved by homebuyers <em style={{ color: "#5b5bd6", fontWeight: 500 }}>everywhere</em>.
          </h2>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {testimonials.map((t, i) => {
            const floatClasses = ["t-inner-a", "t-inner-b", "t-inner-c", "t-inner-d"];
            return (
              <div key={i} className={floatClasses[i]} style={{ animationDelay: `${i * 0.3}s` }}>
                <div
                  className="t-card"
                  style={{
                    background: "#ffffff",
                    borderRadius: 22,
                    padding: "32px 30px",
                    border: "1px solid rgba(12,14,26,0.06)",
                    boxShadow: "0 20px 50px -20px rgba(12,14,26,0.15)",
                    position: "relative",
                    animationDelay: `${i * 0.15}s`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: -16,
                      left: 28,
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: t.accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 10px 24px -8px ${t.accent}88`,
                    }}
                  >
                    <Quote className="w-5 h-5" style={{ color: "#fff" }} strokeWidth={2.5} />
                  </div>

                  <div className="flex gap-1 mb-4 mt-2">
                    {[...Array(t.rating)].map((_, s) => (
                      <Star key={s} className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                    ))}
                  </div>

                  <blockquote
                    className="font-serif"
                    style={{ fontSize: "1.08rem", color: "#0c0e1a", lineHeight: 1.55, fontStyle: "italic", marginBottom: 20 }}
                  >
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>

                  <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid rgba(12,14,26,0.06)" }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        background: `linear-gradient(135deg, ${t.accent} 0%, ${t.accent}aa 100%)`,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                      }}
                    >
                      {t.author.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0c0e1a" }}>{t.author}</p>
                      <p style={{ fontSize: "0.76rem", color: "#4a4d63" }}>
                        {t.role} · <span style={{ color: t.accent, fontWeight: 600 }}>{t.location}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-14">
          {badges.map((b) => (
            <span
              key={b}
              style={{
                background: "#eeebe0",
                border: "1px solid rgba(12,14,26,0.1)",
                borderRadius: 100,
                padding: "8px 16px",
                fontSize: "0.78rem",
                color: "#4a4d63",
                fontWeight: 600,
              }}
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
