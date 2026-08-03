import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import {
  BUYER_SESSION_STORAGE_KEYS,
  BUYER_LOCAL_STORAGE_KEYS,
  clearActiveBuyerSession,
  clearBuyerSessionData,
} from "./buyerSessionStorage";

// The vitest environment is "node", so provide a minimal Storage fake.
class FakeStorage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
}

const fakeSession = new FakeStorage();
const fakeLocal = new FakeStorage();

vi.stubGlobal("window", {});
vi.stubGlobal("sessionStorage", fakeSession);
vi.stubGlobal("localStorage", fakeLocal);

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  fakeSession.clear();
  fakeLocal.clear();
  for (const k of BUYER_SESSION_STORAGE_KEYS) fakeSession.setItem(k, "x");
  for (const k of BUYER_LOCAL_STORAGE_KEYS) fakeLocal.setItem(k, "x");
  fakeLocal.setItem("throuly_buyer_scenarios_v2_user123", "x");
  fakeLocal.setItem("throuly_roadmap_progress_v1_user123", "x");
  fakeLocal.setItem("throuly_private_mode_user_abc", "x");
  fakeLocal.setItem("unrelated_key", "keep-me");
  fakeSession.setItem("unrelated_session_key", "keep-me");
});

describe("clearActiveBuyerSession", () => {
  it("removes only the in-progress calculator keys from sessionStorage", () => {
    clearActiveBuyerSession();
    expect(fakeSession.getItem("throuly_buyers_session")).toBeNull();
    expect(fakeSession.getItem("throuly_editing_scenario")).toBeNull();
    expect(fakeSession.getItem("throuly_pending_save")).toBeNull();
    // Longer-lived flags survive
    expect(fakeSession.getItem("throuly_programs_prompt_seen")).toBe("x");
    expect(fakeSession.getItem("throuly_financial_health_intro_seen")).toBe("x");
    // localStorage untouched
    for (const k of BUYER_LOCAL_STORAGE_KEYS) expect(fakeLocal.getItem(k)).toBe("x");
  });
});

describe("clearBuyerSessionData", () => {
  it("removes all buyer session and local keys, including prefixed ones", () => {
    clearBuyerSessionData();
    for (const k of BUYER_SESSION_STORAGE_KEYS) expect(fakeSession.getItem(k)).toBeNull();
    for (const k of BUYER_LOCAL_STORAGE_KEYS) expect(fakeLocal.getItem(k)).toBeNull();
    expect(fakeLocal.getItem("throuly_buyer_scenarios_v2_user123")).toBeNull();
    expect(fakeLocal.getItem("throuly_roadmap_progress_v1_user123")).toBeNull();
    expect(fakeLocal.getItem("throuly_private_mode_user_abc")).toBeNull();
  });

  it("leaves unrelated keys alone", () => {
    clearBuyerSessionData();
    expect(fakeLocal.getItem("unrelated_key")).toBe("keep-me");
    expect(fakeSession.getItem("unrelated_session_key")).toBe("keep-me");
  });

  it("is safe to call multiple times", () => {
    clearBuyerSessionData();
    expect(() => clearBuyerSessionData()).not.toThrow();
  });
});
