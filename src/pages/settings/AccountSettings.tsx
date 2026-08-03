import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, CreditCard, Bell, Shield, Sparkles } from "lucide-react";
import { TOUR_STORAGE_KEY } from "@/components/onboarding/GuidedTour";
import { clearBuyerSessionData, clearActiveBuyerSession } from "@/lib/buyerSessionStorage";
import { usePrivacy } from "@/contexts/PrivacyContext";

const DASH_MAP: Record<string, string> = {
  agent: "/dashboard/agent",
  client: "/dashboard/client",
  broker: "/dashboard/broker",
  admin: "/dashboard/agent",
};

interface NotificationPrefs {
  deal_updates: boolean;
  new_tasks: boolean;
  new_messages: boolean;
  marketing: boolean;
}

interface PrivacyPrefs {
  show_profile: boolean;
  allow_agent_contact: boolean;
}

const DEFAULT_NOTIF: NotificationPrefs = {
  deal_updates: true,
  new_tasks: true,
  new_messages: true,
  marketing: false,
};

const DEFAULT_PRIVACY: PrivacyPrefs = {
  show_profile: true,
  allow_agent_contact: true,
};

export default function AccountSettings() {
  const { user, profile, refetchProfile } = useAuth();
  const navigate = useNavigate();
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIF);
  const [privacyPrefs, setPrivacyPrefs] = useState<PrivacyPrefs>(DEFAULT_PRIVACY);
  const { isPrivateMode, togglePrivateMode } = usePrivacy();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (profile) {
      const saved = (profile as any).notification_preferences || {};
      setNotifPrefs({
        deal_updates: saved.deal_updates ?? true,
        new_tasks: saved.new_tasks ?? true,
        new_messages: saved.new_messages ?? true,
        marketing: saved.marketing ?? false,
      });
      setPrivacyPrefs({
        show_profile: saved.show_profile ?? true,
        allow_agent_contact: saved.allow_agent_contact ?? true,
      });
    }
  }, [profile]);

  const dashboardPath = "/dashboard/client";

  const savePrefs = async (newNotif: NotificationPrefs, newPrivacy: PrivacyPrefs) => {
    if (!user) return;
    const merged = { ...newNotif, ...newPrivacy };
    const { error } = await supabase
      .from("profiles")
      .update({ notification_preferences: merged })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    }
  };

  const toggleNotif = (key: keyof NotificationPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    savePrefs(updated, privacyPrefs);
  };

  const togglePrivacy = (key: keyof PrivacyPrefs) => {
    const updated = { ...privacyPrefs, [key]: !privacyPrefs[key] };
    setPrivacyPrefs(updated);
    savePrefs(notifPrefs, updated);
  };


  const tierBadge = (tier: string) => {
    switch (tier) {
      case "premium": return "default";
      case "professional": return "secondary";
      case "team": return "secondary";
      default: return "outline";
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_deactivated: true })
        .eq("id", user.id);

      if (error) throw error;

      await supabase.auth.signOut();
      clearBuyerSessionData();
      navigate("/");
      toast({ title: "Account deactivated", description: "Your account has been deactivated." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to={dashboardPath}>Dashboard</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink>Settings</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Account</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-2xl font-bold text-foreground mb-6">Account Settings</h1>

        <div className="space-y-6">
          {/* Getting started / guided tour */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle>Getting started</CardTitle>
              </div>
              <CardDescription>Re-run the guided tour on the calculator page.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-muted-foreground max-w-md">
                Refresh yourself on how throuly scout works — your privacy promise, financial
                inputs, state results, and how to explore scenarios.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (typeof window !== "undefined")
                    window.localStorage.removeItem(TOUR_STORAGE_KEY);
                  clearActiveBuyerSession();
                  navigate("/buyers?tour=1");
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Take the tour again
              </Button>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <CardTitle>Subscription</CardTitle>
              </div>
              <CardDescription>throuly is free — no plans or billing yet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Current plan:</span>
                <Badge variant={tierBadge(profile.subscription_tier) as any} className="capitalize">
                  {profile.subscription_tier}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <CardTitle>Notification Preferences</CardTitle>
              </div>
              <CardDescription>Choose what emails you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                ["deal_updates", "Deal updates", "Get notified when a deal stage changes"],
                ["new_tasks", "New tasks", "Get notified when tasks are assigned to you"],
                ["new_messages", "New messages", "Get notified about new messages"],
                ["marketing", "Marketing emails", "Receive tips, product updates, and offers"],
              ] as const).map(([key, label, desc]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={notifPrefs[key]}
                    onCheckedChange={() => toggleNotif(key)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <CardTitle>Privacy</CardTitle>
              </div>
              <CardDescription>Control your visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Private Mode</Label>
                    <p className="text-xs text-muted-foreground">Browse without saving activity to your account</p>
                  </div>
                  <Switch
                    checked={isPrivateMode}
                    onCheckedChange={togglePrivateMode}
                  />
                </div>
                <p
                  className={cn(
                    "text-xs font-medium transition-all duration-300 ease-out",
                    isPrivateMode
                      ? "text-accent opacity-100 max-h-6 mt-0.5"
                      : "text-muted-foreground opacity-0 max-h-0 mt-0 overflow-hidden"
                  )}
                >
                  Private Mode is on.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Show my profile to other users</Label>
                  <p className="text-xs text-muted-foreground">Other users can see your basic profile info</p>
                </div>
                <Switch
                  checked={privacyPrefs.show_profile}
                  onCheckedChange={() => togglePrivacy("show_profile")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </div>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Deleting your account will deactivate it and remove access. This action cannot be undone.
              </p>
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This will permanently deactivate your account and all associated data.
                Type <strong>DELETE</strong> to confirm.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE to confirm"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteConfirm(""); }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteConfirm !== "DELETE" || deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? "Deleting…" : "Confirm Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
