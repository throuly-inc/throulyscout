"""The 'Tell us about yourself' step must start completely empty.

Regression guard for the pre-fill fix in GenericCalculator.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _utils import BASE_URL, browser_page, dismiss_tour, snap, report, main


async def run() -> int:
    async with browser_page() as page:
        # Fresh visit — no seeded storage so Buyers.tsx doesn't auto-jump
        # to the Financial Health page. The pre-fill regression we're guarding
        # against would show a value here even in a clean session.
        await page.goto(f"{BASE_URL}/buyers", wait_until="networkidle")
        await dismiss_tour(page)

        # Advance from Location step to the questionnaire.
        await page.wait_for_selector('[role="combobox"]', timeout=10000)
        await dismiss_tour(page)
        await page.locator('[role="combobox"]').first.click()
        await page.wait_for_timeout(400)
        await page.keyboard.type("California")
        await page.wait_for_timeout(300)
        await page.keyboard.press("Enter")
        await page.wait_for_timeout(400)
        income = page.locator('input[type="text"], input[type="number"], input[inputmode="numeric"]').first
        await income.fill("120000")
        await page.get_by_role("button", name="See My Affordability").click()
        await page.wait_for_timeout(1500)

        # We may land on the Preliminary Results step first; skip to full calculator
        # via any "Continue" / "See" button that shows up.
        for _ in range(4):
            found = await page.evaluate(
                "() => /Tell us about yourself/i.test(document.body.innerText)"
            )
            if found:
                break
            try:
                await page.locator("button:has-text('Continue')").first.click(timeout=1500)
                await page.wait_for_timeout(600)
            except Exception:
                try:
                    await page.locator("button:has-text('See')").first.click(timeout=1500)
                    await page.wait_for_timeout(600)
                except Exception:
                    break

        state = await page.evaluate(
            """() => {
              const t = document.body.innerText;
              const firstTimeSelected =
                document.querySelector('[aria-pressed="true"], [data-state="on"]');
              return {
                onSection: /Tell us about yourself/i.test(t),
                employmentSet: /W-2 Employee|Self-Employed|Retired/.test(t),
                creditSet: /(Good \\(700|Excellent|Fair|Poor)/.test(t),
                loanSet: /Conventional \\(min|FHA \\(min|VA loan|USDA/.test(t),
                firstTimeSelected: !!firstTimeSelected,
              };
            }"""
        )
        await snap(page, "empty_questionnaire")

        failures = 0
        failures += report("reached 'Tell us about yourself'", state["onSection"])
        failures += report("first-time buyer NOT pre-selected", not state["firstTimeSelected"])
        failures += report("employment NOT pre-filled", not state["employmentSet"])
        failures += report("credit range NOT pre-filled", not state["creditSet"])
        failures += report("loan type NOT pre-filled", not state["loanSet"])
        return failures


if __name__ == "__main__":
    main(run())
