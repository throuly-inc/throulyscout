import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";

interface ComingSoonModalProps {
  open: boolean;
  label: string;
  onClose: () => void;
}

export function ComingSoonModal({ open, label, onClose }: ComingSoonModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    onClose();
    setEmail("");
    setSuccess(false);
    setError("");
  };

  const handleSubmit = async () => {
    const value = email.trim();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error: err } = await supabase
        .from("waitlist" as any)
        .insert({ email: value, source: label });
      if (err) throw err;
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="inset-auto left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 max-w-sm w-[calc(100%-2rem)] rounded-xl max-h-[85vh] overflow-y-auto text-center">
        <DialogHeader>
          <DialogTitle className="text-center">Coming Soon</DialogTitle>
          <DialogDescription className="text-center space-y-3">
            <span className="block text-4xl mt-1">🚀</span>
            <span className="block">
              The <strong>{label}</strong> experience is currently in development. We're working hard to
              bring it to you — stay tuned!
            </span>
            <span className="block text-sm">
              Want to be first to try it? Enter your email below to join the waitlist.
            </span>
          </DialogDescription>
        </DialogHeader>

        {success ? (
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
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="text-center"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button className="w-full" onClick={handleSubmit} disabled={loading}>
              {loading ? "Joining..." : "Join Waitlist"}
            </Button>
          </div>
        )}

        <DialogFooter className="justify-center">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            {success ? "Close" : "Maybe later"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
