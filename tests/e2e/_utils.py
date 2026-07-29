"""Shared helpers for the e2e test suite."""
from __future__ import annotations

import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from playwright.async_api import async_playwright, Browser, BrowserContext, Page

BASE_URL = os.environ.get("E2E_BASE_URL", "http://localhost:8080")
SCREENSHOT_DIR = Path("/tmp/browser/e2e")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def browser_page():
    async with async_playwright() as pw:
        browser: Browser = await pw.chromium.launch(headless=True)
        ctx: BrowserContext = await browser.new_context(
            viewport={"width": 1280, "height": 1800}
        )
        page: Page = await ctx.new_page()
        try:
            yield page
        finally:
            await browser.close()


async def dismiss_tour(page: Page) -> None:
    try:
        await page.get_by_role("button", name="Skip tour").click(timeout=1500)
    except Exception:
        pass


async def snap(page: Page, name: str) -> Path:
    p = SCREENSHOT_DIR / f"{name}.png"
    await page.screenshot(path=str(p))
    return p


def report(name: str, ok: bool, detail: str = "") -> int:
    icon = "PASS" if ok else "FAIL"
    line = f"[{icon}] {name}"
    if detail:
        line += f" — {detail}"
    print(line)
    return 0 if ok else 1


def main(coro) -> None:
    import asyncio
    sys.exit(asyncio.run(coro))
