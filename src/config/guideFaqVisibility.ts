/**
 * FAQ visibility toggle per guide.
 *
 * Flip a flag to `true` once that workflow ships — the guide page will then
 * render its FAQ section AND emit the FAQPage JSON-LD for SEO.
 *
 * Buyers is live today. Sellers, Agents, and Investors stay hidden until
 * each workflow is published.
 */
export const GUIDE_FAQ_VISIBILITY = {
  buyers: true,
  sellers: false,
  agents: false,
  investors: false,
} as const;

export type GuideKey = keyof typeof GUIDE_FAQ_VISIBILITY;

export const isGuideFaqVisible = (key: GuideKey): boolean =>
  GUIDE_FAQ_VISIBILITY[key];
