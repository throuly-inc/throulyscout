import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Shield, FileCheck2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import heroCoupleImg from "@/assets/hero-couple.jpg";

interface HeroSectionProps {
  onLearnMore?: () => void;
}

const PURPLE = "#5B4FE5";
const GREEN = "#5A8A6B";
const INK = "#0c0e1a";
const CREAM = "#F5F2ED";

export function HeroSection({ onLearnMore }: HeroSectionProps) {
  const { user } = useAuth();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonLabel, setComingSoonLabel] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState("");

  const [cardsVisible, setCardsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCardsVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  const cardAnim = (delayMs: number) => ({
    opacity: cardsVisible ? 1 : 0,
    transform: cardsVisible ? "translateY(0) scale(1)" : "translateY(18px) scale(0.96)",
    transition: `all 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms`,
  });
  const handleComingSoon = (label: string) => {
    setComingSoonLabel(label);
    setShowComingSoon(true);
  };

  const handleCloseComingSoon = () => {
    setShowComingSoon(false);
    setWaitlistEmail("");
    setWaitlistSuccess(false);
    setWaitlistError("");
  };

  const handleWaitlistSubmit = async () => {
    const email = waitlistEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setWaitlistError("Please enter a valid email address.");
      return;
    }
    setWaitlistLoading(true);
    setWaitlistError("");
    try {
      const { error } = await supabase.from("waitlist" as any).insert({ email, source: comingSoonLabel });
      if (error) throw error;
      setWaitlistSuccess(true);
    } catch {
      setWaitlistError("Something went wrong. Please try again.");
    } finally {
      setWaitlistLoading(false);
    }
  };

  return (
    <>
      {/* ============ HERO ============ */}
      <section
        className="relative overflow-hidden lg:flex lg:items-center"
        style={{ background: CREAM, paddingTop: 0, paddingBottom: "32px" }}
      >
        {/* Background image — desktop: bleeds to right edge */}
        <div className="absolute top-0 right-0 h-full hidden lg:block" style={{ width: "76%" }}>
          <img
            src={heroCoupleImg}
            alt="Happy couple holding keys to their new home"
            className="w-full h-full object-cover"
            style={{ objectPosition: "center left" }}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            width={1600}
            height={1000}
          />
          {/* Soft left-edge fade blending into cream */}
          <div
            className="absolute inset-y-0 left-0 pointer-events-none"
            style={{
              width: "46%",
              background: `linear-gradient(to right, ${CREAM} 0%, rgba(245,242,237,0.96) 18%, rgba(245,242,237,0.72) 42%, rgba(245,242,237,0.28) 72%, transparent 100%)`,
            }}
          />
        </div>

        <div
          className="relative z-10 mx-auto px-4 md:px-6 w-full pt-20 lg:min-h-[88vh] lg:flex lg:items-center"
          style={{ maxWidth: 1280 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
            {/* LEFT COLUMN */}
            <div className="relative z-10 2xl:-translate-x-28">
              {/* Pill badge — desktop only; mobile version inside image overlay */}
              <div
                className="hidden lg:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-7"
                style={{
                  background: "rgba(91,79,229,0.10)",
                  color: PURPLE,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: PURPLE,
                    display: "inline-block",
                  }}
                />
                Throuly Scout · For Buyers
              </div>

              {/* Headline — desktop only; mobile version inside image overlay */}
              <h1
                className="hidden lg:block font-serif mb-6"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "clamp(2.6rem, 8vw, 7.2rem)",
                  fontWeight: 700,
                  lineHeight: 1.02,
                  letterSpacing: "-0.02em",
                  background: `linear-gradient(90deg, ${INK} 0%, ${PURPLE} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Real Estate
                <span
                  className="block italic"
                  style={{
                    fontWeight: 600,
                    background: `linear-gradient(90deg, ${INK} 0%, ${PURPLE} 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  on your terms.
                </span>
              </h1>

              {/* Subheading — desktop only; mobile version inside image overlay */}
              <p
                className="hidden lg:block mb-8"
                style={{
                  fontSize: "1.15rem",
                  color: INK,
                  fontWeight: 600,
                }}
              >
                Your Privacy. Your Control. Your Journey.
              </p>

              {/* DESKTOP: buttons here (before right column cards) */}
              <div className="hidden lg:flex flex-wrap items-center gap-3">
                <Link
                  to={user ? "/dashboard" : "/buyers"}
                  className="inline-flex items-center justify-center transition-all"
                  style={{
                    background: INK,
                    color: "#fff",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    padding: "14px 26px",
                    borderRadius: 10,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = PURPLE)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
                >
                  {user ? "GO TO DASHBOARD" : "TRY IT FOR FREE"}
                </Link>
                {!user && (
                  <Link
                    to="/auth?mode=login"
                    className="inline-flex items-center justify-center transition-all"
                    style={{
                      background: "#fff",
                      color: INK,
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      padding: "13px 26px",
                      borderRadius: 10,
                      border: `1.5px solid ${PURPLE}`,
                    }}
                  >
                    LOG IN
                  </Link>
                )}
              </div>

              {/* MOBILE / TABLET — full-bleed image with text overlay */}
              <div className="lg:hidden -mx-4 md:-mx-6 -mt-6">
                <div className="relative w-full overflow-hidden" style={{ minHeight: "clamp(540px, 78vh, 740px)" }}>
                  {/* Background image */}
                  <img
                    src={heroCoupleImg}
                    alt="Happy couple holding keys to their new home"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: "center" }}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    width={1200}
                    height={900}
                  />

                  {/* Top gradient: cream → transparent (text readability) */}
                  <div
                    className="absolute inset-x-0 top-0 pointer-events-none"
                    style={{
                      height: "52%",
                      background: `linear-gradient(to bottom, ${CREAM} 0%, rgba(245,242,237,0.95) 25%, rgba(245,242,237,0.5) 65%, transparent 100%)`,
                    }}
                  />

                  {/* Bottom gradient: transparent → cream (card blending) */}
                  <div
                    className="absolute inset-x-0 bottom-0 pointer-events-none"
                    style={{
                      height: "50%",
                      background: `linear-gradient(to top, ${CREAM} 0%, rgba(245,242,237,0.75) 40%, transparent 100%)`,
                    }}
                  />

                  {/* Text content floating on image */}
                  <div className="relative z-10 px-4 md:px-6 pt-14 pb-28">
                    {/* Pill badge */}
                    <div
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5"
                      style={{
                        background: "rgba(91,79,229,0.10)",
                        color: PURPLE,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: PURPLE,
                          display: "inline-block",
                        }}
                      />
                      Throuly Scout · For Buyers
                    </div>

                    {/* Headline */}
                    <div
                      role="heading"
                      aria-level={1}
                      className="font-serif mb-4"
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: "clamp(2.6rem, 8vw, 7.2rem)",
                        fontWeight: 700,
                        lineHeight: 1.02,
                        letterSpacing: "-0.02em",
                        background: `linear-gradient(90deg, ${INK} 0%, ${PURPLE} 100%)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Real Estate
                      <span
                        className="block italic"
                        style={{
                          fontWeight: 600,
                          background: `linear-gradient(90deg, ${INK} 0%, ${PURPLE} 100%)`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        on your terms.
                      </span>
                    </div>

                    {/* Subheading */}
                    <p
                      className="mb-6"
                      style={{
                        fontSize: "1.15rem",
                        color: INK,
                        fontWeight: 600,
                      }}
                    >
                      Your Privacy. Your Control. Your Journey.
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        to={user ? "/dashboard" : "/buyers"}
                        className="inline-flex items-center justify-center transition-all"
                        style={{
                          background: INK,
                          color: "#fff",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          padding: "14px 26px",
                          borderRadius: 10,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = PURPLE)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
                      >
                        {user ? "GO TO DASHBOARD" : "TRY IT FOR FREE"}
                      </Link>
                      {!user && (
                        <Link
                          to="/auth?mode=login"
                          className="inline-flex items-center justify-center transition-all"
                          style={{
                            background: "#fff",
                            color: INK,
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            padding: "13px 26px",
                            borderRadius: 10,
                            border: `1.5px solid ${PURPLE}`,
                          }}
                        >
                          LOG IN
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN — reserved for hero image bleed on desktop */}
            <div className="hidden lg:block" aria-hidden />

          </div>
        </div>
      </section>

      {/* One-platform pitch removed — buyer-only app */}


      {/* Coming Soon Modal */}
      <Dialog open={showComingSoon} onOpenChange={handleCloseComingSoon}>
        <DialogContent className="inset-auto left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 max-w-sm w-[calc(100%-2rem)] rounded-xl max-h-[85vh] overflow-y-auto text-center">
          <DialogHeader>
            <DialogTitle className="text-center">Coming Soon</DialogTitle>
            <DialogDescription className="text-center space-y-3">
              <span className="block text-4xl mt-1">🚀</span>
              <span className="block">
                The <strong>{comingSoonLabel}</strong> experience is currently in development. We're working hard to
                bring it to you — stay tuned!
              </span>
              <span className="block text-sm">
                Want to be first to try it? Enter your email below to join the waitlist.
              </span>
            </DialogDescription>
          </DialogHeader>

          {waitlistSuccess ? (
            <div className="py-2 text-center space-y-1">
              <p className="text-2xl">🎉</p>
              <p className="font-medium text-foreground text-sm">You're on the list!</p>
              <p className="text-xs text-muted-foreground">We'll reach out as soon as it's ready.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={waitlistEmail}
                onChange={(e) => {
                  setWaitlistEmail(e.target.value);
                  setWaitlistError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleWaitlistSubmit()}
                className="text-center"
              />
              {waitlistError && <p className="text-xs text-destructive">{waitlistError}</p>}
              <Button className="w-full" onClick={handleWaitlistSubmit} disabled={waitlistLoading}>
                {waitlistLoading ? "Joining..." : "Join Waitlist"}
              </Button>
            </div>
          )}

          <DialogFooter className="justify-center">
            <Button variant="ghost" size="sm" onClick={handleCloseComingSoon}>
              {waitlistSuccess ? "Close" : "Maybe later"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FloatingCard({
  icon,
  accent,
  title,
  body,
  caption,
  compact,
}: {
  icon: React.ReactNode;
  accent: string;
  title: string;
  body: string;
  caption: string;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: compact ? 18 : 24,
        padding: compact ? "14px 16px" : "26px 28px",
        boxShadow: compact
          ? "0 2px 8px rgba(12,14,26,0.08), 0 8px 24px rgba(12,14,26,0.10)"
          : "0 2px 4px rgba(12,14,26,0.04), 0 20px 40px rgba(12,14,26,0.10), 0 48px 80px rgba(12,14,26,0.06)",
        display: "flex",
        gap: compact ? 12 : 20,
        border: "1px solid rgba(12,14,26,0.03)",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: compact ? 38 : 54,
          height: compact ? 38 : 54,
          borderRadius: 12,
          background: `${accent}12`,
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <h3
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: compact ? "0.92rem" : "1.15rem",
            fontWeight: 700,
            color: INK,
            marginBottom: compact ? 3 : 5,
            lineHeight: 1.25,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: compact ? "0.78rem" : "0.92rem",
            color: "#4a4d63",
            lineHeight: 1.5,
            marginBottom: compact ? 8 : 14,
          }}
        >
          {body}
        </p>
        <div
          style={{
            width: compact ? 32 : 44,
            height: 2.5,
            background: accent,
            borderRadius: 2,
            marginBottom: compact ? 6 : 10,
          }}
        />
        <span
          style={{
            fontSize: compact ? "0.68rem" : "0.78rem",
            fontWeight: 600,
            color: accent,
            letterSpacing: "0.03em",
          }}
        >
          {caption}
        </span>
      </div>
    </div>
  );
}

function JourneyCard({
  eyebrow,
  title,
  body,
  note,
  cta,
  accent,
  href,
  onComingSoon,
}: {
  eyebrow: string;
  title: string;
  body: string;
  note: string;
  cta: string;
  accent: string;
  href?: string;
  onComingSoon?: () => void;
}) {
  const inner = (
    <div
      className="group h-full flex flex-col"
      style={{
        padding: "32px 28px 28px",
        border: "1px solid rgba(12,14,26,0.10)",
        borderRadius: 12,
        background: "#fff",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          fontSize: "0.65rem",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: accent,
        }}
      >
        {eyebrow}
      </span>
      <h3
        className="font-serif mt-3 mb-4"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1.85rem",
          fontWeight: 700,
          color: INK,
          letterSpacing: "-0.01em",
          lineHeight: 1.15,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "0.92rem",
          color: "#4a4d63",
          lineHeight: 1.55,
          marginBottom: 14,
        }}
      >
        {body}
      </p>
      <p
        style={{
          fontSize: "0.82rem",
          fontStyle: "italic",
          color: "#4a4d63",
          lineHeight: 1.55,
          marginBottom: 24,
          flex: 1,
        }}
      >
        {note}
      </p>
      <div className="flex items-center gap-3 pt-2" style={{ borderTop: "0" }}>
        <span style={{ fontSize: "0.9rem", color: INK, fontWeight: 500 }}>{cta}</span>
        <span style={{ flex: 1, height: 1, background: "rgba(12,14,26,0.15)" }} />
        <span style={{ color: INK, fontSize: "1.1rem" }}>→</span>
      </div>
    </div>
  );

  if (href)
    return (
      <Link to={href} className="block h-full">
        {inner}
      </Link>
    );
  return (
    <button onClick={onComingSoon} className="text-left h-full w-full">
      {inner}
    </button>
  );
}
