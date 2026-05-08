import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo/constants"

const LAST_MODIFIED = "2026-05-08T00:00:00.000Z"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/seo`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/cd-player`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ]
}
