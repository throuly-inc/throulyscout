// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { writeFileSync } from "fs";
import { resolve } from "path";

// @ts-ignore relative to project root
import { statesData } from "../src/lib/states";

const BASE_URL = "https://throuly.com";

const SITE_LASTMOD = "2026-07-10";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const entries: SitemapEntry[] = [
  // Core marketing
  { path: "/", lastmod: SITE_LASTMOD, changefreq: "weekly", priority: "1.0" },
  { path: "/welcome", lastmod: SITE_LASTMOD, changefreq: "monthly", priority: "0.6" },

  // Segment landing pages
  { path: "/scout", lastmod: SITE_LASTMOD, changefreq: "weekly", priority: "0.9" },
  { path: "/list", lastmod: SITE_LASTMOD, changefreq: "weekly", priority: "0.9" },
  { path: "/compass", lastmod: SITE_LASTMOD, changefreq: "weekly", priority: "0.9" },

  // Buyer journey
  { path: "/buyers", lastmod: SITE_LASTMOD, changefreq: "weekly", priority: "0.9" },
  { path: "/buyers/programs", lastmod: SITE_LASTMOD, changefreq: "weekly", priority: "0.7" },
  { path: "/analyzer", lastmod: SITE_LASTMOD, changefreq: "weekly", priority: "0.8" },
  { path: "/properties/search", lastmod: SITE_LASTMOD, changefreq: "daily", priority: "0.7" },

  // Seller journey (currently disabled / coming soon)
  // { path: "/sellers", lastmod: SITE_LASTMOD, changefreq: "weekly", priority: "0.8" },
  // { path: "/portal", lastmod: SITE_LASTMOD, changefreq: "monthly", priority: "0.5" },
  // { path: "/match/sellers", lastmod: SITE_LASTMOD, changefreq: "weekly", priority: "0.6" },

  // Connect (privacy-first matching)

  // Account entry points
  { path: "/auth", lastmod: SITE_LASTMOD, changefreq: "monthly", priority: "0.4" },
  { path: "/saved", lastmod: SITE_LASTMOD, changefreq: "weekly", priority: "0.5" },

  // Resources + entry points
  { path: "/resources", lastmod: SITE_LASTMOD, changefreq: "monthly", priority: "0.6" },
  { path: "/news", lastmod: SITE_LASTMOD, changefreq: "weekly", priority: "0.6" },
  { path: "/try-it-free", lastmod: SITE_LASTMOD, changefreq: "monthly", priority: "0.6" },

  // Guides (blog-style, authored by The throuly Team)
  { path: "/guides/buyers", lastmod: "2026-03-14", changefreq: "monthly", priority: "0.6" },
  { path: "/guides/sellers", lastmod: SITE_LASTMOD, changefreq: "monthly", priority: "0.6" },
  { path: "/guides/investors", lastmod: "2026-05-16", changefreq: "monthly", priority: "0.6" },
  { path: "/guides/realistic-affordability", lastmod: "2026-06-20", changefreq: "monthly", priority: "0.7" },

  // State-specific buyer program guides (50 states)
  ...statesData.map((s) => ({
    path: `/guides/programs/${s.abbreviation.toLowerCase()}`,
    lastmod: SITE_LASTMOD,
    changefreq: "monthly" as const,
    priority: "0.5" as const,
  })),
];

function generateSitemap(items: SitemapEntry[]) {
  const urls = items.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
