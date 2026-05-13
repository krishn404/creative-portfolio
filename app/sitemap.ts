import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo/constants"

/** Prerender sitemap at build time; URLs must never be relative or localhost. */
export const dynamic = "force-static"

const builtAt = new Date()

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: builtAt,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/seo`,
      lastModified: builtAt,
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/cd-player`,
      lastModified: builtAt,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ]
}

