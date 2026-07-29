"""Anonymous visitors can reach the buyer / financial-health / results pages.

Guards against any regression that puts a login redirect in front of these
public routes.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _utils import BASE_URL, browser_page, snap, report, main


ROUTES = [
    "/",
    "/buyers",
    "/homebuying-estimate/financial-health",
    "/homebuying-estimate/results",
]


async def run() -> int:
    failures = 0
    async with browser_page() as page:
        for route in ROUTES:
            resp = await page.goto(f"{BASE_URL}{route}", wait_until="domcontentloaded")
            await page.wait_for_timeout(500)
            final = page.url
            status = resp.status if resp else 0
            redirected_to_auth = "/auth" in final and "/auth" not in route
            ok = status == 200 and not redirected_to_auth
            if not ok:
                await snap(page, f"anon_{route.strip('/').replace('/', '_') or 'root'}")
            failures += report(
                f"anonymous can load {route}",
                ok,
                f"status={status} final={final}",
            )
    return failures


if __name__ == "__main__":
    main(run())
