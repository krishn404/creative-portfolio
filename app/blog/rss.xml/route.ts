import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import { SITE_URL, BLOG_NAME, BLOG_DESCRIPTION } from "@/lib/seo/constants"
import { displayDescription } from "@/lib/blog/seo"
import type { BlogPost } from "@/lib/blog/utils"

export const revalidate = 3600
const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '\"': "&quot;" })[char]!)

export async function GET() {
  let posts: BlogPost[] = []
  try { posts = await convex.query(api.posts.getPublishedPosts) } catch (error) { console.error("Failed to build KTWK feed:", error) }
  const items = posts.map((post) => `<item><title>${escapeXml(post.title)}</title><link>${SITE_URL}/blog/${post.slug}</link><guid isPermaLink="true">${SITE_URL}/blog/${post.slug}</guid><description>${escapeXml(displayDescription(post))}</description>${post.publishedAt ? `<pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>` : ""}</item>`).join("\n")
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${BLOG_NAME} (KTWK)</title><link>${SITE_URL}/blog</link><description>${escapeXml(BLOG_DESCRIPTION)}</description><language>en</language>${items}</channel></rss>`, { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" } })
}
