import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { z } from "zod";
import { SEO } from "@/components/seo/SEO";

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: passwordSchema,
  fullName: z.string().min(2, "Name must be at least 2 characters").optional(),
});

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

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [forgotMode, setForgotMode] = useState(searchParams.get("mode") === "forgot");
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailError, setResetEmailError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const redirectUser = async (userId: string) => {
    const returnTo = searchParams.get("returnTo");

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", userId)
      .single();

    if (!profile || !profile.onboarding_complete) {
      navigate(returnTo ? `/onboarding?returnTo=${encodeURIComponent(returnTo)}` : "/onboarding");
      return;
    }

    if (returnTo && returnTo.startsWith("/")) {
      navigate(returnTo);
      return;
    }

    navigate("/dashboard");
  };


  useEffect(() => {
    // If already signed in, redirect immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) redirectUser(session.user.id);
    });
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === 'SIGNED_IN') {
        // Auto-save pending estimate from before sign-in
        try {
          const pending = localStorage.getItem("throuly_pending_save");
          if (pending) {
            const payload = JSON.parse(pending);
            supabase
              .from("saved_scenarios" as any)
              .insert({ ...payload, user_id: session.user.id })
              .then(({ error }) => {
                if (error) {
                  // Keep the pending payload so the next sign-in retries it.
                  toast.error("We couldn't save your estimate to your account. It will retry next time you sign in.");
                  return;
                }
                toast.success("Your estimate has been saved to your account");
                localStorage.removeItem("throuly_pending_save");
              });
          }
        } catch {
          localStorage.removeItem("throuly_pending_save");
        }
        redirectUser(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = () => {
    const formData = isLogin 
      ? { email, password } 
      : { email, password, fullName };
    
    const result = authSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string; fullName?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field as keyof typeof fieldErrors] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password. Please try again.");
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success("Welcome back!");
      } else {
        const redirectUrl = `${window.location.origin}/`;
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in instead.");
            setIsLogin(true);
          } else {
            toast.error(error.message);
          }
          return;
        }

        if (data?.user?.identities && data.user.identities.length === 0) {
          toast.error("This email is already registered. Please sign in instead.");
          setIsLogin(true);
          return;
        }

        toast.success("Account created! You can now sign in.");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = authSchema.shape.email.safeParse(resetEmail);
    if (!result.success) {
      setResetEmailError(result.error.errors[0]?.message ?? "Please enter a valid email address");
      return;
    }
    setResetEmailError("");
    setResetLoading(true);

    try {
      await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    } finally {
      // Always show the same confirmation whether or not the email is
      // registered, so this can't be used to enumerate accounts.
      setResetLoading(false);
      setResetSent(true);
    }
  };

  const forgotPasswordCard = resetSent ? (
    <div className="text-center space-y-4">
      <h1 className="text-2xl font-semibold text-foreground mb-2">Check your email</h1>
      <p className="text-muted-foreground text-sm">
        If an account exists for <span className="font-medium text-foreground">{resetEmail}</span>,
        we've sent a link to reset your password.
      </p>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setForgotMode(false);
          setResetSent(false);
          setResetEmail("");
        }}
      >
        Back to sign in
      </Button>
    </div>
  ) : (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Reset your password</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleForgotSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="resetEmail" className="text-sm text-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="resetEmail"
              type="email"
              placeholder="you@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="pl-10"
            />
          </div>
          {resetEmailError && (
            <p className="text-xs text-destructive">{resetEmailError}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="hero"
          className="w-full"
          size="lg"
          disabled={resetLoading}
        >
          {resetLoading ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setForgotMode(false)}
          className="text-sm text-accent hover:underline font-medium"
        >
          Back to sign in
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Sign In or Create Account | throuly"
        description="Sign in to your throuly account or create a free account to save affordability results and track your homebuying journey."
        path="/auth"
      />
      <Navbar />

      <main className="pt-32 pb-24 px-4">
        <div className="container mx-auto max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            {forgotMode ? forgotPasswordCard : (
            <>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isLogin
                  ? "Sign in to access your dashboard"
                  : "Join throuly to get started"}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm text-foreground">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-xs text-destructive">{errors.fullName}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm text-foreground">
                    Password
                  </Label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="text-xs text-accent hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
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
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
                {!isLogin && password.length > 0 && (
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

              <Button
                type="submit"
                variant="hero"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            {/* Toggle */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                  }}
                  className="text-accent hover:underline font-medium"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
            </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
