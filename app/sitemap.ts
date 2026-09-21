import type { MetadataRoute } from "next"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import type { BlogPost } from "@/lib/blog/utils"
import { SITE_URL } from "@/lib/seo/constants"

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
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ]

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : generatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  return [...staticPages, ...postPages]
}
