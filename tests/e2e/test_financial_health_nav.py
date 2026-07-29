"""Financial Health CTA for anonymous users must read 'View my financial results'
and navigate to /homebuying-estimate/results WITHOUT bouncing through /auth.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _utils import BASE_URL, browser_page, snap, report, main


async def run() -> int:
    async with browser_page() as page:
        # Seed a valid buyer session so the Financial Health page has data to render.
        await page.goto(BASE_URL, wait_until="domcontentloaded")
        await page.evaluate(
            """() => sessionStorage.setItem('throuly_buyers_session', JSON.stringify({
              selectedState: { name: 'California', abbreviation: 'CA' },
              homePrice: 600000,
              hoaMonthly: 0,
              financialProfile: {
                yearlyIncome: 150000,
                savings: 60000,
                monthlyDebt: 500,
                creditScore: 740,
                isFirstTimeBuyer: true,
                employmentType: 'w2',
                propertyType: 'single-family',
              },
              loanTypeId: 'conventional',
            }))"""
        )

        await page.goto(
            f"{BASE_URL}/homebuying-estimate/financial-health",
            wait_until="networkidle",
        )
        await page.wait_for_timeout(1200)
        await snap(page, "fh_page")

        button_text = await page.evaluate(
            """() => {
              const btns = Array.from(document.querySelectorAll('button'));
              const cta = btns.find(b => /view my financial results|view results|save.*financial/i.test(b.innerText));
              return cta ? cta.innerText.trim() : null;
            }"""
        )

        failures = 0
        # For anonymous visitors the label must NOT begin with "Save"
        anon_label_ok = bool(button_text) and "save" not in button_text.lower()
        failures += report(
            "anon CTA reads 'View my financial results'",
            anon_label_ok,
            f"label={button_text!r}",
        )

        if button_text:
            await page.evaluate(
                """(txt) => {
                  const btn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.innerText.trim() === txt);
                  btn && btn.click();
                }""",
                button_text,
            )
            await page.wait_for_timeout(1500)

        final_url = page.url
        went_to_results = "/homebuying-estimate/results" in final_url
        no_auth_bounce = "/auth" not in final_url
        failures += report(
            "CTA lands on /homebuying-estimate/results",
            went_to_results,
            f"final={final_url}",
        )
        failures += report("no /auth redirect for anon", no_auth_bounce, f"final={final_url}")
        return failures


if __name__ == "__main__":
    main(run())
