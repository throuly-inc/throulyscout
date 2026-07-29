import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ctaKeys from "@/assets/cta-keys.jpg";

export function CTASection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #0c0f3d 0%, #141870 50%, #0e0b3a 100%)',
        padding: '6rem 0',
      }}
    >
      {/* Background image with dark overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src={ctaKeys}
          alt=""
          aria-hidden
          loading="lazy"
          width={1600}
          height={1000}
          className="w-full h-full object-cover"
          style={{ opacity: 0.22, mixBlendMode: 'luminosity' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(160deg, rgba(12,15,61,0.85) 0%, rgba(20,24,112,0.78) 50%, rgba(14,11,58,0.88) 100%)',
          }}
        />
      </div>

      {/* Centered radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(91,91,214,0.18) 0%, transparent 70%)' }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Eyebrow badge */}
          <span
            className="inline-block mb-6"
            style={{
              color: '#a5b4fc',
              border: '1px solid rgba(165,180,252,0.25)',
              background: 'rgba(165,180,252,0.15)',
              borderRadius: '100px',
              padding: '6px 16px',
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Ready to Get Started?
          </span>
          
          <h2
            className="font-serif mb-6"
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 300,
              color: 'white',
              lineHeight: 1.1,
            }}
          >
            Ready to take control of your
            <span className="block italic" style={{ color: '#a5b4fc' }}>
              real estate journey?
            </span>
          </h2>
          
          <p
            className="mb-10 max-w-2xl mx-auto"
            style={{
              fontSize: '0.92rem',
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.8,
            }}
          >
            Join thousands of buyers who are already using throuly 
            to streamline their real estate transactions.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <button
                className="transition-all duration-200"
                style={{
                  background: 'white',
                  color: '#07091a',
                  fontWeight: 700,
                  padding: '14px 32px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  boxShadow: '0 4px 20px rgba(255,255,255,0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(255,255,255,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,255,255,0.1)';
                }}
              >
                Get Started Free <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            </Link>
            <Link to="/resources">
              <button
                className="transition-all duration-200"
                style={{
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 500,
                  padding: '14px 32px',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                }}
              >
                Explore our platform features
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
