import type { MetadataRoute } from "next"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import type { BlogPost } from "@/lib/blog/utils"
import { CREATOR_PROFILE_PATH, SITE_URL } from "@/lib/seo/constants"
import { allTags, isIndexableTag, postsForTag, tagPath } from "@/lib/blog/seo"

/** Refresh article URLs regularly as published posts change. */
export const revalidate = 3600

const SEO_RELEASE_DATE = new Date("2026-11-15T00:00:00.000Z")
const FALLBACK_ARTICLES = [
  "arsu-bhai",
  "bharg",
  "bluk",
  "krameri",
  "hadi",
  "vidhu-kota",
  "rohh",
  "renaissance-album-review-by-Kayze",
] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let posts: BlogPost[] = []
  let livePostsLoaded = false

  try {
    posts = await convex.query(api.posts.getPublishedPosts)
    livePostsLoaded = true
  } catch (error) {
    // Keep the sitemap crawlable during a transient data-service failure.
    // Google can still discover every established article and retry fresh data later.
    console.error("Failed to add blog posts to sitemap:", error)
  }

  const lastPostChange = posts.reduce((latest, post) => {
    const timestamp = post.updatedAt ?? post.publishedAt ?? 0
    return Math.max(latest, timestamp)
  }, 0)
  const writingUpdatedAt = lastPostChange ? new Date(lastPostChange) : undefined

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: SEO_RELEASE_DATE,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}${CREATOR_PROFILE_PATH}`,
      lastModified: SEO_RELEASE_DATE,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: writingUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    { url: `${SITE_URL}/about-ktwk`, lastModified: writingUpdatedAt, changeFrequency: "weekly", priority: 0.9 },
  ]

  const postPages: MetadataRoute.Sitemap = livePostsLoaded
    ? posts.map((post) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt ? new Date(post.updatedAt) : post.publishedAt ? new Date(post.publishedAt) : undefined,
        changeFrequency: "monthly",
        priority: 0.8,
      }))
    : FALLBACK_ARTICLES.map((slug) => ({
        url: `${SITE_URL}/blog/${slug}`,
        lastModified: new Date("2026-11-09T00:00:00.000Z"),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      }))

  const tagPages: MetadataRoute.Sitemap = livePostsLoaded ? allTags(posts).filter(({ label }) => isIndexableTag(posts, label)).map(({ label }) => {
    const latestForTag = postsForTag(posts, label).reduce((latest, post) =>
      Math.max(latest, post.updatedAt ?? post.publishedAt ?? 0), 0)
    return {
      url: `${SITE_URL}${tagPath(label)}`,
      lastModified: latestForTag ? new Date(latestForTag) : undefined,
      changeFrequency: "weekly",
      priority: 0.5,
    }
  }) : []

  return [...staticPages, ...postPages, ...tagPages]
}
