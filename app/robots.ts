import type { MetadataRoute } from "next"
import { SITE_HOST, SITE_URL } from "@/lib/seo/constants"

/** Static metadata route; avoid dynamic evaluation so crawlers always get a stable file. */
export const dynamic = "force-static"

const SITEMAP_URL = `${SITE_URL}/sitemap.xml`

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: ["GPTBot", "Google-Extended", "ClaudeBot", "PerplexityBot"],
        allow: "/",
      },
    ],
    sitemap: SITEMAP_URL,
    // Host must be a hostname (not a full URL); full URLs confuse parsers and are non-standard.
    host: SITE_HOST,
  }
}

