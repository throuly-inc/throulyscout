import { createContext, useContext, useMemo, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

type SubscriptionTier = "free" | "premium" | "professional" | "team";

type Feature =
  | "full_address"
  | "property_analysis"
  | "unlimited_searches"
  | "unlimited_calculations";

const FEATURE_MIN_TIER: Record<Feature, SubscriptionTier> = {
  full_address: "premium",
  property_analysis: "premium",
  unlimited_searches: "premium",
  unlimited_calculations: "premium",
};

const TIER_RANK: Record<string, number> = {
  free: 0,
  premium: 1,
  professional: 2,
  team: 3,
};

interface SubscriptionContextValue {
  tier: SubscriptionTier;
  isPremium: boolean;
  canAccess: (feature: Feature) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  tier: "free",
  isPremium: false,
  canAccess: () => false,
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();

  const value = useMemo<SubscriptionContextValue>(() => {
    const raw = (profile?.subscription_tier || "free") as string;
    const tier = (TIER_RANK[raw] !== undefined ? raw : "free") as SubscriptionTier;
    const rank = TIER_RANK[tier];

    return {
      tier,
      isPremium: rank >= 1,
      canAccess: (feature: Feature) => {
        const required = FEATURE_MIN_TIER[feature];
        return rank >= TIER_RANK[required];
      },
    };
  }, [profile?.subscription_tier]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
