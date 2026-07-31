/**
 * Storage keys used by the anonymous / logged-in buyer flow.
 * Kept in one place so logout / privacy resets stay in sync.
 */
export const BUYER_SESSION_STORAGE_KEYS = [
  "throuly_buyers_session",
  "throuly_editing_scenario",
  "throuly_pending_save",
  "throuly_programs_prompt_seen",
  "throuly_financial_health_intro_seen",
] as const;

export const BUYER_LOCAL_STORAGE_KEYS = [
  "throuly_saved_scenarios",
  "throuly_savings_goal_planner",
  "throuly_home_purchase_planner",
] as const;

/**
 * Clears just the in-progress calculator run (inputs + editing marker) so a
 * "Buyer Calculator" / "Try the calculator" link starts a fresh calculation
 * instead of dropping the user back into their last results. Unlike
 * `clearBuyerSessionData`, this intentionally leaves saved scenarios and
 * other longer-lived localStorage data untouched.
 */
export function clearActiveBuyerSession() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("throuly_buyers_session");
    sessionStorage.removeItem("throuly_editing_scenario");
    sessionStorage.removeItem("throuly_pending_save");
  } catch {
    /* ignore */
  }
}

/**

 * Clears every trace of the previous buyer's financial-health / calculator
 * data from browser storage so a logged-out user starting the calculator
 * again does NOT see the previous user's inputs, results, or scenarios.
 *
 * Safe to call multiple times and in SSR (guards on `typeof window`).
 */
export function clearBuyerSessionData() {
  if (typeof window === "undefined") return;
  try {
    for (const k of BUYER_SESSION_STORAGE_KEYS) sessionStorage.removeItem(k);
  } catch {
    /* ignore */
  }
  try {
    for (const k of BUYER_LOCAL_STORAGE_KEYS) localStorage.removeItem(k);
    // Prefixed keys (per-user / versioned)
    const prefixes = [
      "throuly_buyer_scenarios_v",
      "throuly_roadmap_progress_v",
      "throuly_private_mode_user_",
    ];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && prefixes.some((p) => key.startsWith(p))) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    /* ignore */
  }
}
