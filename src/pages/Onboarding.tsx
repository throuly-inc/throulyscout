import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

/**
 * Buyer-only app: onboarding is a single confirm step that marks the profile
 * as onboarded and sends the user to the buyer calculator.
 */
export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refetchProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Auto-complete for signed-in users
    (async () => {
      setSaving(true);
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ onboarding_complete: true })
          .eq("id", user.id);
        if (error) throw error;
        await refetchProfile();
        navigate("/dashboard/client");
      } catch (err: any) {
        toast.error(err?.message || "Something went wrong. Please try again.");
      } finally {
        setSaving(false);
      }
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="font-serif text-3xl text-foreground">Welcome to Throuly</h1>
        <p className="text-muted-foreground">Setting up your dashboard…</p>
        {!saving && (
          <Button onClick={() => navigate("/dashboard/client")}>Continue</Button>
        )}
      </div>
    </div>
  );
}
