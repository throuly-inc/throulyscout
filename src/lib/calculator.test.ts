import { describe, it, expect } from "vitest";
import { calculateMortgage, type FinancialProfile } from "./calculator";
import type { StateData } from "./states";

const state: StateData = {
  name: "Texas",
  abbreviation: "TX",
  avgPropertyTax: 1.6,
  avgHomeInsurance: 2000,
  avgClosingCost: 2.5,
  medianHomePrice: 320000,
  avgMortgageRate: 6.75,
  firstTimeBuyerPrograms: true,
};

const strongProfile: FinancialProfile = {
  yearlyIncome: 180000,
  monthlyDebt: 300,
  savings: 120000,
  creditScore: 760,
};

const cashShortProfile: FinancialProfile = {
  ...strongProfile,
  savings: 5000,
};

const highDebtProfile: FinancialProfile = {
  yearlyIncome: 60000,
  monthlyDebt: 2500,
  savings: 120000,
  creditScore: 760,
};

describe("calculateMortgage – qualifiesLoan / hasSufficientCash / cashShortfall consistency", () => {
  it("qualifies fully when income, credit, and savings are all strong", () => {
    const r = calculateMortgage(350000, 20, state, strongProfile, 0, "conventional");
    expect(r.qualifiesLoan).toBe(true);
    expect(r.hasSufficientCash).toBe(true);
    expect(r.cashShortfall).toBe(0);
    expect(r.qualifies).toBe(true);
  });

  it("qualifies for loan but flags cash shortfall when savings are insufficient", () => {
    const r = calculateMortgage(350000, 20, state, cashShortProfile, 0, "conventional");
    expect(r.qualifiesLoan).toBe(true);
    expect(r.hasSufficientCash).toBe(false);
    expect(r.cashShortfall).toBeGreaterThan(0);
    expect(r.cashShortfall).toBe(Math.max(0, Math.round(r.totalCashNeeded - cashShortProfile.savings)));
    expect(r.qualifies).toBe(false);
  });

  it("fails loan qualification on DTI regardless of ample savings", () => {
    const r = calculateMortgage(500000, 20, state, highDebtProfile, 0, "conventional");
    expect(r.qualifiesLoan).toBe(false);
    expect(r.hasSufficientCash).toBe(true);
    expect(r.cashShortfall).toBe(0);
    expect(r.qualifies).toBe(false);
  });

  it("qualifies at or below maxAffordablePrice (Compare grid alignment)", () => {
    const r = calculateMortgage(strongProfile.yearlyIncome, 20, state, strongProfile, 0, "conventional");
    const atMax = calculateMortgage(r.maxAffordablePrice, 20, state, strongProfile, 0, "conventional");
    expect(atMax.qualifiesLoan).toBe(true);
  });

  it("does not qualify above maxAffordablePrice", () => {
    const r = calculateMortgage(300000, 20, state, highDebtProfile, 0, "conventional");
    const above = calculateMortgage(r.maxAffordablePrice + 50000, 20, state, highDebtProfile, 0, "conventional");
    expect(above.qualifiesLoan).toBe(false);
  });

  it("cashShortfall is never negative", () => {
    const r = calculateMortgage(200000, 20, state, strongProfile, 0, "conventional");
    expect(r.cashShortfall).toBeGreaterThanOrEqual(0);
  });

  it("overall qualifies === qualifiesLoan && hasSufficientCash across scenarios", () => {
    const scenarios = [
      { price: 250000, profile: strongProfile },
      { price: 400000, profile: cashShortProfile },
      { price: 300000, profile: highDebtProfile },
      { price: 600000, profile: strongProfile },
    ];
    for (const { price, profile } of scenarios) {
      const r = calculateMortgage(price, 20, state, profile, 0, "conventional");
      expect(r.qualifies).toBe(r.qualifiesLoan && r.hasSufficientCash);
    }
  });

  it("FHA qualification uses expanded thresholds consistently", () => {
    const r = calculateMortgage(300000, 3.5, state, strongProfile, 0, "fha");
    expect(r.loanType.id).toBe("fha");
    expect(r.qualifies).toBe(r.qualifiesLoan && r.hasSufficientCash);
  });
});
