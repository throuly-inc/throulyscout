import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  path: string; // route path, e.g. "/buyers"
  ogType?: "website" | "article";
  image?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
}

const SITE = "https://throulyscout.com";
const DEFAULT_OG_IMAGE = `${SITE}/og-image.webp`;

export function SEO({ title, description, path, ogType = "website", image = DEFAULT_OG_IMAGE, jsonLd, noindex = false }: SEOProps) {
  const url = `${SITE}${path}`;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(s)}</script>
      ))}
    </Helmet>
  );
}
