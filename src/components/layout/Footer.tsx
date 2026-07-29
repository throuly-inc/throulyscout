import { forwardRef, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, Home, Shield } from "lucide-react";
import { ComingSoonModal } from "@/components/common/ComingSoonModal";

const SocialIcon = ({ href, label, children }: { href: string; label: string; children: React.ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="transition-colors"
    style={{ color: "rgba(255,255,255,0.50)" }}
    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.95)")}
    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.50)")}
  >
    {children}
  </a>
);

export const Footer = forwardRef<HTMLElement>((props, ref) => {
  const [comingSoonLabel, setComingSoonLabel] = useState<string | null>(null);
  return (
    <footer ref={ref} style={{ background: "#04050f" }}>
      <div className="container mx-auto px-4" style={{ padding: "3.5rem 1rem 0" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4" style={{ gap: "3rem 2.5rem" }}>
          {/* Logo + tagline */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center" aria-label="throuly home">
              <span
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "1.6rem",
                  fontWeight: 500,
                  color: "#ffffff",
                  letterSpacing: "-0.01em",
                }}
              >
                throuly
              </span>
            </Link>
            <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.50)", lineHeight: 1.75 }}>
              Your complete guide to real estate investing across all 50 states.
            </p>
            <div className="flex items-center gap-1.5">
              <Shield style={{ width: "14px", height: "14px", color: "rgba(255,255,255,0.30)" }} />
              <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>
                Privacy-First — Your data stays yours
              </span>
            </div>
          </div>

          {/* For Users */}
          <div>
            <h4
              style={{
                fontSize: "0.62rem",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "rgba(255,255,255,0.60)",
                marginBottom: "1rem",
              }}
            >
              FOR USERS
            </h4>
            <ul className="space-y-2">
              {[
                { to: "/buyers", label: "Buyer Calculator" },
                { to: "/analyzer", label: "Address Analyzer" },
                { to: "/resources", label: "Resources" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="transition-colors"
                    style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.60)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.95)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.60)")}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4
              style={{
                fontSize: "0.62rem",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "rgba(255,255,255,0.60)",
                marginBottom: "1rem",
              }}
            >
              RESOURCES
            </h4>
            <ul className="space-y-2">
              {[
                { to: "/resources", label: "Guides" },
                { to: "/", label: "API Access" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="transition-colors"
                    style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.60)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.95)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.60)")}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Social */}
          <div>
            <h4
              style={{
                fontSize: "0.62rem",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "rgba(255,255,255,0.60)",
                marginBottom: "1rem",
              }}
            >
              CONTACT
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Mail style={{ width: "16px", height: "16px", color: "rgba(255,255,255,0.50)" }} />
                <a
                  href="mailto:info@throuly.com"
                  className="transition-colors"
                  style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.60)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.95)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.60)")}
                >
                  info@throuly.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone style={{ width: "16px", height: "16px", color: "rgba(255,255,255,0.50)" }} />
                <a
                  href="tel:+13072047105"
                  className="transition-colors"
                  style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.60)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.95)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.60)")}
                >
                  1-307-204-7105
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Home style={{ width: "16px", height: "16px", color: "rgba(255,255,255,0.50)" }} />
                <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.60)" }}>Available in all 50 states</span>
              </li>
            </ul>

            <h4
              style={{
                fontSize: "0.62rem",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "rgba(255,255,255,0.60)",
                marginTop: "1.75rem",
                marginBottom: "0.75rem",
              }}
            >
              FOLLOW US
            </h4>
            <div className="flex items-center gap-3">
              <SocialIcon href="https://x.com/throulyofficial?s=11" label="throuly on X">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://linkedin.com/company/throuly" label="throuly on LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://www.instagram.com/throulyofficial/" label="throuly on Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://www.reddit.com/user/throuly/" label="throuly on Reddit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-6.99 4.87-3.86 0-6.99-2.176-6.99-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-1.438zM9.513 13.395a1.125 1.125 0 0 1 0 2.25 1.125 1.125 0 0 1 0-2.25zm5.227 0a1.125 1.125 0 0 1 0 2.25 1.125 1.125 0 0 1 0-2.25z" />
                </svg>
              </SocialIcon>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="text-center"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            marginTop: "2.5rem",
            padding: "2rem 0",
          }}
        >
          <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>
            &copy; {new Date().getFullYear()} Throuly. All rights reserved.
          </p>
        </div>
      </div>
      <ComingSoonModal
        open={!!comingSoonLabel}
        label={comingSoonLabel || ""}
        onClose={() => setComingSoonLabel(null)}
      />
    </footer>
  );
});

Footer.displayName = "Footer";
