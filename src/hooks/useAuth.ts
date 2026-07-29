import { useState, useEffect, createContext, useContext, ReactNode, createElement } from "react";
import { supabase } from "@/integrations/supabase/client";
import { clearBuyerSessionData } from "@/lib/buyerSessionStorage";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  onboarding_complete: boolean;
  subscription_tier: string;
  phone: string | null;
  avatar_url: string | null;
  notification_preferences: Record<string, any>;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refetchProfile: () => Promise<void> | void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function useAuthState(): AuthContextValue {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = async (userId: string, attempt = 0) => {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, onboarding_complete, subscription_tier, phone, avatar_url, notification_preferences")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) {
        // Profile row may not exist yet immediately after signup (trigger race).
        // Retry a few times with backoff before giving up.
        if (attempt < 5) {
          setTimeout(() => fetchProfile(userId, attempt + 1), 400 * (attempt + 1));
          return;
        }
        setProfile(null);
        return;
      }

      setProfile(data as UserProfile);
    } catch {
      if (attempt < 5) {
        setTimeout(() => fetchProfile(userId, attempt + 1), 400 * (attempt + 1));
        return;
      }
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Set up listener FIRST so we don't miss events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      // Only treat explicit sign-out as logged-out. Ignore transient null
      // sessions from token refresh races / multi-tab events.
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setLoading(false);
        // Belt-and-suspenders: any sign-out path (button, expired token,
        // multi-tab) wipes the prior buyer's calculator/financial-health data
        // so the next visitor never sees stale results.
        clearBuyerSessionData();
        return;
      }

      if (session?.user) {
        setUser((prev) => (prev?.id === session.user.id ? prev : session.user));
        // Only refetch profile when the user actually changes
        setProfile((prevProfile) => {
          if (!prevProfile || prevProfile.id !== session.user.id) {
            // Defer to avoid running inside the auth callback
            setTimeout(() => {
              if (isMounted) fetchProfile(session.user.id);
            }, 0);
          }
          return prevProfile;
        });
        setLoading(false);
      }
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isLoading = loading || profileLoading;

  return {
    user,
    profile,
    loading: isLoading,
    refetchProfile: () => (user ? fetchProfile(user.id) : undefined),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useAuthState();
  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx) return ctx;
  // Fallback (should not happen if AuthProvider is mounted at root)
  return useAuthState();
}
