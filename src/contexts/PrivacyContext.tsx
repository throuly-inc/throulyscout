import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type PrivacyContextValue = {
  isPrivateMode: boolean;
  togglePrivateMode: () => void;
  setPrivateMode: (v: boolean) => void;
  /** Returns true if action allowed, false if blocked by Private Mode (and shows toast). */
  guardSave: (label?: string) => boolean;
  /** Whether analytics/tracking events should be emitted. */
  isTrackingAllowed: boolean;
  /** Signed-in users get preference persisted per account; signed-out users session-only. */
  isSignedIn: boolean;
};

const ANON_KEY = "throuly_private_mode_session"; // sessionStorage — cleared when tab closes
const userKey = (uid: string) => `throuly_private_mode_user_${uid}`;

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

function readInitial(): boolean {
  try {
    return sessionStorage.getItem(ANON_KEY) === "1";
  } catch {
    return false;
  }
}

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isPrivateMode, setIsPrivateMode] = useState<boolean>(readInitial);
  const lastAnnounced = useRef<boolean | null>(null);
  const hydratingUser = useRef(false);

  // Track auth state — hydrate preference from per-user localStorage when signed in.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        try {
          const stored = localStorage.getItem(userKey(uid));
          if (stored !== null) {
            hydratingUser.current = true;
            setIsPrivateMode(stored === "1");
          }
        } catch {
          /* ignore */
        }
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        try {
          const stored = localStorage.getItem(userKey(uid));
          if (stored !== null) {
            hydratingUser.current = true;
            setIsPrivateMode(stored === "1");
          }
        } catch {
          /* ignore */
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Persist: per-user localStorage for signed-in, sessionStorage otherwise.
    try {
      if (userId) {
        localStorage.setItem(userKey(userId), isPrivateMode ? "1" : "0");
      }
      sessionStorage.setItem(ANON_KEY, isPrivateMode ? "1" : "0");
    } catch {
      /* ignore */
    }

    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("private-mode", isPrivateMode);
    }

    if (lastAnnounced.current === null) {
      lastAnnounced.current = isPrivateMode;
      return;
    }
    if (hydratingUser.current) {
      // Silent update when we hydrated from stored account preference.
      hydratingUser.current = false;
      lastAnnounced.current = isPrivateMode;
      return;
    }
    if (lastAnnounced.current === isPrivateMode) return;
    lastAnnounced.current = isPrivateMode;
    if (isPrivateMode) {
      toast.success("Private Mode is on", {
        description: "Browsing anonymously — nothing is tracked or saved to your account.",
      });
    } else {
      toast("Private Mode is off", {
        description: "Your activity and saved scenarios will sync to your account again.",
      });
    }
  }, [isPrivateMode, userId]);

  const togglePrivateMode = useCallback(() => setIsPrivateMode((v) => !v), []);
  const setPrivateMode = useCallback((v: boolean) => setIsPrivateMode(v), []);

  const guardSave = useCallback(
    (label = "save") => {
      if (isPrivateMode) {
        toast("Private Mode is on", {
          description: `Turn off Private Mode to ${label}. Nothing is stored to your account while it's on.`,
        });
        return false;
      }
      return true;
    },
    [isPrivateMode],
  );

  return (
    <PrivacyContext.Provider
      value={{
        isPrivateMode,
        togglePrivateMode,
        setPrivateMode,
        guardSave,
        isTrackingAllowed: !isPrivateMode,
        isSignedIn: !!userId,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error("usePrivacy must be used within PrivacyProvider");
  return ctx;
}
