# End-to-end tests

Playwright-based smoke tests that lock in behaviors we don't want to regress:

1. **`test_anonymous_access.py`** — the buyer calculator, financial-health
   page, and results page all load for anonymous (logged-out) visitors and
   don't force a login redirect.
2. **`test_empty_questionnaire.py`** — after selecting a state + income and
   advancing into "Tell us about yourself", every field (first-time buyer,
   employment, credit range, preferred loan type) starts blank/unselected
   for a fresh visitor.
3. **`test_financial_health_nav.py`** — on the Financial Health page the
   primary CTA reads "View my financial results" for anonymous users and
   navigating it lands on `/homebuying-estimate/results` without any auth
   redirect.
4. **`test_logout_clears_data.py`** — a session with prior buyer inputs in
   `sessionStorage`/`localStorage` is fully cleared once the app dispatches
   a Supabase `SIGNED_OUT` event, so the next visit shows a blank calculator.

## Running

The dev server must be reachable at `http://localhost:8080` (Vite is already
running in the Lovable sandbox). Playwright + Chromium are pre-installed.

```bash
bash tests/e2e/run.sh
```

Each script is standalone; you can also run one at a time:

```bash
python3 tests/e2e/test_anonymous_access.py
```

Exit code `0` = pass, non-zero = fail. Screenshots for any failure land in
`/tmp/browser/e2e/`.
