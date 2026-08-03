import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";
import { z } from "zod";
import { SEO } from "@/components/seo/SEO";

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

function getPasswordStrength(pw: string): { label: string; color: string; percent: number } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { label: "Weak", color: "bg-destructive", percent: 33 };
  if (score <= 4) return { label: "Medium", color: "bg-warning", percent: 66 };
  return { label: "Strong", color: "bg-success", percent: 100 };
}

type Status = "checking" | "ready" | "invalid" | "success";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const hashError = hashParams.get("error_description") || hashParams.get("error");
    if (hashError) {
      setStatus("invalid");
      return;
    }
    const hasRecoveryHash = hashParams.get("type") === "recovery";

    // Register the listener before checking the session, so we don't miss
    // the PASSWORD_RECOVERY event if it fires between mount and this check.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setStatus("ready");
      }
    });

    // Fallback: the event may have already fired (during client init) before
    // this listener was attached — if so, the session already reflects it.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus((current) => {
        if (current !== "checking") return current;
        return hasRecoveryHash && session ? "ready" : hasRecoveryHash ? "checking" : "invalid";
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const validate = () => {
    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      setError(result.error.errors[0]?.message ?? "Please enter a valid password");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        toast.error(updateError.message);
        return;
      }
      setStatus("success");
      toast.success("Password updated");
      setTimeout(() => navigate("/dashboard"), 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Reset Password | throuly"
        description="Set a new password for your throuly account."
        path="/reset-password"
      />
      <Navbar />

      <main className="pt-32 pb-24 px-4">
        <div className="container mx-auto max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            {status === "checking" && (
              <p className="text-center text-muted-foreground text-sm">Verifying your reset link...</p>
            )}

            {status === "invalid" && (
              <div className="text-center space-y-4">
                <h1 className="text-2xl font-semibold text-foreground mb-2">Link expired</h1>
                <p className="text-muted-foreground text-sm">
                  This password reset link is invalid or has expired. Request a new one to continue.
                </p>
                <Button variant="hero" onClick={() => navigate("/auth?mode=forgot")}>
                  Request a new link
                </Button>
              </div>
            )}

            {status === "success" && (
              <div className="text-center space-y-4">
                <h1 className="text-2xl font-semibold text-foreground mb-2">Password updated</h1>
                <p className="text-muted-foreground text-sm">Taking you to your dashboard...</p>
              </div>
            )}

            {status === "ready" && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-semibold text-foreground mb-2">Set a new password</h1>
                  <p className="text-muted-foreground text-sm">Choose a new password for your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm text-foreground">
                      New password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {password.length > 0 && (
                      <div className="space-y-1">
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${getPasswordStrength(password).color}`}
                            style={{ width: `${getPasswordStrength(password).percent}%` }}
                          />
                        </div>
                        <p className={`text-xs font-medium ${
                          getPasswordStrength(password).label === 'Weak' ? 'text-destructive' :
                          getPasswordStrength(password).label === 'Medium' ? 'text-warning' : 'text-success'
                        }`}>
                          {getPasswordStrength(password).label}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm text-foreground">
                      Confirm new password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {error && <p className="text-xs text-destructive">{error}</p>}
                  </div>

                  <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
                    {loading ? "Updating..." : "Update password"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;
