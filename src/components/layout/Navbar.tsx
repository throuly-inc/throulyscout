import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  LayoutDashboard,
  Settings,
  Calculator,
  BookOpen,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PrivacyIndicator } from "@/components/privacy/PrivacyIndicator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { clearBuyerSessionData, clearActiveBuyerSession } from "@/lib/buyerSessionStorage";
import throulyIcon from "@/assets/throuly-icon.png";
import throulyLogo from "@/assets/throuly-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const productLinks = [
  { href: "/buyers", label: "Buyers" },
];

const standaloneLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/resources", label: "Resources" },
  { href: "/analyzer", label: "Analyzer" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const dashboardEnabled = !!user;
  const dashboardPath = "/dashboard/client";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Wipe any prior buyer's calculator / financial-health data so the next
    // visitor to the calculator starts from a clean slate.
    clearBuyerSessionData();
    navigate("/");
  };

  const userInitials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  const isActive = (href: string) => location.pathname.startsWith(href);

  const isProductPage = location.pathname === "/scout";
  const productCTA = isProductPage ? { label: "Get Early Access", href: "/auth?mode=signup" } : null;

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: "rgba(247,244,238,0.55)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          height: "64px",
          borderBottom: "1px solid rgba(12,14,26,0.06)",
        }}
      >
        <div className="mx-auto px-4 md:px-6" style={{ maxWidth: "1280px" }}>
          {user ? (
            <div className="flex items-center justify-between h-16">
              {/* Left: Logo + nav links (hidden on dashboard pages) */}
              <div className="flex items-center gap-8">
                <Link
                  to="/"
                  className="shrink-0 font-semibold tracking-tight flex items-baseline gap-1.5"
                  aria-label="throuly scout home"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "1.35rem",
                  }}
                >
                  <span
                    style={{
                      background: "linear-gradient(90deg, #0c0e1a 0%, #1a1f6b 55%, #3b2fbf 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    throuly
                  </span>
                  <span style={{ fontSize: "0.9rem", fontStyle: "italic", color: "#5b5bd6", fontWeight: 500 }}>
                    scout
                  </span>
                </Link>

                {!location.pathname.startsWith("/dashboard") && (
                  <div className="hidden md:flex items-center gap-0">
                    <Link
                      to="/buyers"
                      onClick={clearActiveBuyerSession}
                      className={cn(
                        "relative px-4 py-5 transition-colors duration-200",
                        isActive("/buyers") ? "text-[#0c0e1a]" : "text-[#4a4d63] hover:text-[#0c0e1a]",
                      )}
                      style={{ fontSize: "0.8rem", fontWeight: 600 }}
                    >
                      Buyer Calculator
                    </Link>
                  </div>
                )}
              </div>

              {/* Right: Profile dropdown (desktop) + Hamburger (mobile) */}
              <div className="flex items-center justify-end gap-2">
                <div className="hidden md:block">
                  <PrivacyIndicator />
                </div>
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex items-center gap-2 rounded-full border p-1 pr-3 hover:bg-secondary/50 transition-colors"
                        style={{ borderColor: "rgba(12,14,26,0.1)" }}
                      >
                        <Avatar className="h-8 w-8">
                          {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="Avatar" />}
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {profile?.full_name ? userInitials : <User className="w-4 h-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm max-w-[120px] truncate" style={{ color: "#0c0e1a" }}>
                          {profile?.full_name || user.email}
                        </span>
                        <ChevronDown className="w-3 h-3" style={{ color: "#4a4d63" }} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {dashboardEnabled && (
                        <DropdownMenuItem asChild>
                          <Link to={dashboardPath} className="w-full cursor-pointer">
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            My Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to="/settings/profile" className="w-full cursor-pointer">
                          <User className="w-4 h-4 mr-2" />
                          My Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/settings/account" className="w-full cursor-pointer">
                          <Settings className="w-4 h-4 mr-2" />
                          Account Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/buyers" onClick={clearActiveBuyerSession} className="w-full cursor-pointer">
                          <Calculator className="w-4 h-4 mr-2" />
                          Buyer Calculator
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/analyzer" className="w-full cursor-pointer">
                          <Search className="w-4 h-4 mr-2" />
                          Analyzer
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/resources" className="w-full cursor-pointer">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Resources
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <button
                  className="md:hidden p-2"
                  onClick={() => setIsOpen(!isOpen)}
                  aria-label="Toggle menu"
                  style={{ color: "#0c0e1a" }}
                >
                  {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-8">
                <Link
                  to="/"
                  className="shrink-0 font-semibold tracking-tight flex items-baseline gap-1.5"
                  aria-label="throuly scout home"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "1.35rem",
                  }}
                >
                  <span
                    style={{
                      background: "linear-gradient(90deg, #0c0e1a 0%, #1a1f6b 55%, #3b2fbf 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    throuly
                  </span>
                  <span style={{ fontSize: "0.9rem", fontStyle: "italic", color: "#5b5bd6", fontWeight: 500 }}>
                    scout
                  </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-0">
                  {/* Product Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "relative flex items-center gap-1 px-4 py-5 transition-colors duration-200 outline-none",
                          productLinks.some((l) => isActive(l.href))
                            ? "text-[#0c0e1a]"
                            : "text-[#4a4d63] hover:text-[#0c0e1a]",
                        )}
                        style={{ fontSize: "0.8rem", fontWeight: 600 }}
                      >
                        Product
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44">
                      {productLinks.map((link) => (
                        <DropdownMenuItem key={link.href} asChild>
                          <Link
                            to={link.href}
                            onClick={link.href === "/buyers" ? clearActiveBuyerSession : undefined}
                            className={cn(
                              "w-full cursor-pointer",
                              isActive(link.href) ? "font-semibold text-[#0c0e1a]" : "",
                            )}
                          >
                            {link.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Standalone links */}
                  {standaloneLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={cn(
                        "relative px-4 py-5 transition-colors duration-200",
                        isActive(link.href) ? "text-[#0c0e1a]" : "text-[#4a4d63] hover:text-[#0c0e1a]",
                      )}
                      style={{ fontSize: "0.8rem", fontWeight: 600 }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right side - Desktop */}
              <div className="hidden md:flex items-center gap-4">
                {isProductPage && (
                  <Link
                    to="/"
                    className="transition-colors duration-200"
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "#4a4d63",
                      border: "1px solid rgba(12,14,26,0.1)",
                      borderRadius: "100px",
                      padding: "6px 16px",
                    }}
                  >
                    ← All Products
                  </Link>
                )}
                <PrivacyIndicator />

                <div className="flex items-center gap-3">
                  <Link
                    to="/auth?mode=login"
                    className="transition-colors duration-200"
                    style={{ color: "#0c0e1a", fontSize: "0.8rem", fontWeight: 600 }}
                  >
                    Log In
                  </Link>
                  <Link
                    to={productCTA?.href || "/buyers"}
                    onClick={() => {
                      if (!productCTA?.href || productCTA.href === "/buyers") clearActiveBuyerSession();
                    }}
                  >
                    <button
                      className="transition-all duration-200"
                      style={{
                        backgroundColor: "#0c0e1a",
                        color: "#f7f4ee",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        padding: "8px 20px",
                        borderRadius: "6px",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#5b5bd6")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0c0e1a")}
                    >
                      {productCTA?.label || "TRY IT FOR FREE"}
                    </button>
                  </Link>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
                style={{ color: "#0c0e1a" }}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile slide-in panel */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setIsOpen(false)}>
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-72 shadow-xl transition-transform duration-300 ease-in-out md:hidden flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        style={{ background: "#f7f4ee" }}
      >
        {/* Mobile panel header */}
        <div
          className="flex items-center justify-between h-16 px-4"
          style={{ borderBottom: "1px solid rgba(12,14,26,0.06)" }}
        >
          <span className="font-serif text-lg" style={{ color: "#0c0e1a" }}>
            Menu
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 transition-colors"
            aria-label="Close menu"
            style={{ color: "#4a4d63" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile nav links */}
        {user ? (
          <>
            <div className="flex-1 overflow-y-auto py-4">
              {dashboardEnabled && (
                <Link
                  to={dashboardPath}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-6 py-3.5 transition-colors duration-200"
                  style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0c0e1a" }}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  My Dashboard
                </Link>
              )}
              <Link
                to="/settings/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-6 py-3.5 transition-colors duration-200"
                style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0c0e1a" }}
              >
                <User className="w-4 h-4 mr-2" />
                My Profile
              </Link>
              <Link
                to="/settings/account"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-6 py-3.5 transition-colors duration-200"
                style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0c0e1a" }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </Link>
              <Link
                to="/buyers"
                onClick={() => {
                  clearActiveBuyerSession();
                  setIsOpen(false);
                }}
                className="flex items-center px-6 py-3.5 transition-colors duration-200"
                style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0c0e1a" }}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Buyer Calculator
              </Link>
              <Link
                to="/analyzer"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-6 py-3.5 transition-colors duration-200"
                style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0c0e1a" }}
              >
                <Search className="w-4 h-4 mr-2" />
                Analyzer
              </Link>
              <Link
                to="/resources"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-6 py-3.5 transition-colors duration-200"
                style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0c0e1a" }}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Resources
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="flex items-center w-full text-left px-6 py-3.5 text-destructive"
                style={{ fontSize: "0.8rem", fontWeight: 600 }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4">
              <div className="px-6 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#a8aac0" }}>
                Product
              </div>
              {productLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => {
                    if (link.href === "/buyers") clearActiveBuyerSession();
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center px-6 py-3.5 transition-colors duration-200",
                    isActive(link.href) ? "font-medium" : "",
                  )}
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: isActive(link.href) ? "#0c0e1a" : "#4a4d63",
                    backgroundColor: isActive(link.href) ? "rgba(91,91,214,0.08)" : undefined,
                    borderLeft: isActive(link.href) ? "2px solid #5b5bd6" : "2px solid transparent",
                  }}
                >
                  {link.label}
                </Link>
              ))}

              <div className="my-2" style={{ borderTop: "1px solid rgba(12,14,26,0.06)" }} />

              {standaloneLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-6 py-3.5 transition-colors duration-200"
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: isActive(link.href) ? "#0c0e1a" : "#4a4d63",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="px-6 py-5 space-y-4" style={{ borderTop: "1px solid rgba(12,14,26,0.06)" }}>
              <PrivacyIndicator />
              <div className="space-y-3">
                <Link
                  to="/auth?mode=login"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-sm font-medium py-2.5"
                  style={{ color: "#0c0e1a" }}
                >
                  Log In
                </Link>
                <Link
                  to="/buyers"
                  onClick={() => {
                    clearActiveBuyerSession();
                    setIsOpen(false);
                  }}
                  className="block text-center font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: "#0c0e1a",
                    color: "#f7f4ee",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    padding: "10px 20px",
                    borderRadius: "6px",
                  }}
                >
                  TRY IT FOR FREE
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
