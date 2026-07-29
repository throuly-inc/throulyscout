## Goal

Add a fourth donut ("100% · Free") to the metrics band on `/how-it-works`, and replace the two unverifiable claims (73% overestimate, 3-min estimate) with source-backed figures. The 50-states claim is accurate — we ship state-specific tax/insurance/rate config for all 50 (`src/lib/states.ts`).

## Verified numbers to use

1. **Donut 1 — Indigo, Search icon**
   - Big: **55%**
   - Caption: "of U.S. consumers think it would be at least *somewhat easy* to get a mortgage — the reality is more complex."
   - Source: Fannie Mae Mortgage Understanding Study (2024 refresh).

2. **Donut 2 — Coral, Clock icon**
   - Big: **~5 min**
   - Caption: "to a personalized affordability estimate — no signup required."
   - This is a product claim we control (soften from "3 min" to "~5 min" to stay honest with the questionnaire length).

3. **Donut 3 — Sage, MapPin icon** (unchanged)
   - Big: **50**
   - Caption: "states covered with real local taxes, insurance, and interest rates."

4. **Donut 4 — NEW, Ink/dark accent, Gift or BadgeCheck icon**
   - Big: **100%**
   - Caption: "Free to view your results — no credit card, no signup."
   - Ring fills to 100%.

## Implementation

- Edit `src/components/how-it-works/HowItWorksMetrics.tsx`:
  - Update the `stats` array: swap donut 1's text/number, soften donut 2, add donut 4.
  - Change grid from `md:grid-cols-3` to `md:grid-cols-2 lg:grid-cols-4` and widen `max-w-4xl` → `max-w-6xl` so four donuts fit cleanly on desktop and reflow to 2×2 on tablet, 1-col on mobile.
  - Reduce ring `SIZE` from 200 → 176 to keep the row visually balanced at 4-up.
  - Pick a 4th brand-appropriate accent (Ink `#0c0e1a` ring with cream inner, or reuse indigo tint) — I'll use a neutral Ink `#0c0e1a` stroke so it reads as "throuly-native / free" and matches the CTA button below.
  - Import `BadgeCheck` from `lucide-react` for the free donut.
  - Keep the existing IntersectionObserver / reduced-motion / staggered delay logic; just extend to 4 items.

- Add a small footnote line under the donut row referencing the Fannie Mae source in muted body copy so the stat is defensible: "Source: Fannie Mae Mortgage Understanding Study, 2024." (Text-only, no external link.)

## Files touched

- `src/components/how-it-works/HowItWorksMetrics.tsx` — extend to 4 stats, new copy, 4-column grid, source footnote.

No other files change.
