"""Signing out must wipe the previous buyer's calculator / financial-health
data so the next visitor to /buyers doesn't see prior inputs.

We simulate the SIGNED_OUT event that Supabase dispatches on logout and
verify the storage keys are gone.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _utils import BASE_URL, browser_page, snap, report, main


SEED_JS = """() => {
  sessionStorage.setItem('throuly_buyers_session', JSON.stringify({
    selectedState: { name: 'Texas', abbreviation: 'TX' },
    homePrice: 750000,
    hoaMonthly: 200,
    financialProfile: {
      yearlyIncome: 300000,
      savings: 120000,
      monthlyDebt: 2000,
      creditScore: 800,
      isFirstTimeBuyer: false,
      employmentType: 'w2',
      propertyType: 'single-family',
    },
    loanTypeId: 'conventional',
  }));
  sessionStorage.setItem('throuly_editing_scenario', 'abc123');
  sessionStorage.setItem('throuly_pending_save', '{"foo":"bar"}');
  localStorage.setItem('throuly_saved_scenarios', '[{"id":"1"}]');
  localStorage.setItem('throuly_savings_goal_planner', '{"target":100}');
}"""


async def run() -> int:
    async with browser_page() as page:
        # Load the app so React (and the useAuth listener) is mounted.
        await page.goto(BASE_URL, wait_until="networkidle")

        # Seed prior-user data in both storages.
        await page.evaluate(SEED_JS)
        before = await page.evaluate(
            """() => ({
              buyer: sessionStorage.getItem('throuly_buyers_session'),
              editing: sessionStorage.getItem('throuly_editing_scenario'),
              pending: sessionStorage.getItem('throuly_pending_save'),
              scenarios: localStorage.getItem('throuly_saved_scenarios'),
              planner: localStorage.getItem('throuly_savings_goal_planner'),
            })"""
        )

        # Fire the same SIGNED_OUT event Supabase emits on logout.
        await page.evaluate(
            """async () => {
              const mod = await import('/src/integrations/supabase/client.ts');
              await mod.supabase.auth.signOut();
            }"""
        )
        await page.wait_for_timeout(800)

        after = await page.evaluate(
            """() => ({
              buyer: sessionStorage.getItem('throuly_buyers_session'),
              editing: sessionStorage.getItem('throuly_editing_scenario'),
              pending: sessionStorage.getItem('throuly_pending_save'),
              scenarios: localStorage.getItem('throuly_saved_scenarios'),
              planner: localStorage.getItem('throuly_savings_goal_planner'),
            })"""
        )

        failures = 0
        failures += report(
            "seed populated storage before logout",
            all(before.values()),
            f"before={before}",
        )
        for key in ("buyer", "editing", "pending", "scenarios", "planner"):
            failures += report(
                f"logout cleared {key}",
                after[key] is None,
                f"after={after[key]!r}",
            )

        # And the calculator itself now renders empty.
        await page.goto(f"{BASE_URL}/buyers", wait_until="networkidle")
        await page.wait_for_timeout(600)
        placeholder = await page.evaluate(
            """() => {
              const combo = document.querySelector('[role="combobox"]');
              return combo ? combo.innerText.trim() : null;
            }"""
        )
        await snap(page, "post_logout_buyers")
        failures += report(
            "calculator state selector is blank after logout",
            placeholder in (None, "", "Choose a state...", "Select State"),
            f"combobox={placeholder!r}",
        )
        return failures


if __name__ == "__main__":
    main(run())
