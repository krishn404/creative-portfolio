import type { MetadataRoute } from "next"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import type { BlogPost } from "@/lib/blog/utils"
import { SITE_URL } from "@/lib/seo/constants"
import { allTags, postsForTag, tagPath } from "@/lib/blog/seo"

/** Refresh article URLs regularly as published posts change. */
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const generatedAt = new Date()
  let posts: BlogPost[] = []

  try {
    posts = await convex.query(api.posts.getPublishedPosts)
  } catch (error) {
    console.error("Failed to add blog posts to sitemap:", error)
  }

  const lastPostChange = posts.reduce((latest, post) => {
    const timestamp = post.updatedAt ?? post.publishedAt ?? 0
    return Math.max(latest, timestamp)
  }, 0)
  const writingUpdatedAt = lastPostChange ? new Date(lastPostChange) : generatedAt

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/cd-player`,
      lastModified: generatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: writingUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    { url: `${SITE_URL}/about-ktwk`, lastModified: writingUpdatedAt, changeFrequency: "weekly", priority: 0.9 },
  ]

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt ? new Date(post.updatedAt) : post.publishedAt ? new Date(post.publishedAt) : generatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  const tagPages: MetadataRoute.Sitemap = allTags(posts).map(({ label }) => {
    const latestForTag = postsForTag(posts, label).reduce((latest, post) =>
      Math.max(latest, post.updatedAt ?? post.publishedAt ?? 0), 0)
    return {
      url: `${SITE_URL}${tagPath(label)}`,
      lastModified: latestForTag ? new Date(latestForTag) : generatedAt,
      changeFrequency: "weekly",
      priority: 0.5,
    }
  })

  return [...staticPages, ...postPages, ...tagPages]
}
