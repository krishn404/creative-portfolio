import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import type { BlogPost } from "@/lib/blog/utils"
import { BLOG_ALIASES, BLOG_NAME, CREATOR_INSTAGRAM, SITE_URL } from "@/lib/seo/constants"

export const revalidate = 3600

export async function GET() {
  let posts: BlogPost[] = []
  try {
    posts = await convex.query(api.posts.getPublishedPosts)
  } catch (error) {
    console.error("Failed to add blog posts to llms.txt:", error)
  }

  const postLines = posts.flatMap((post) => [
    `- ${post.title}`,
    `  url: ${SITE_URL}/blog/${post.slug}`,
    `  summary: ${post.excerpt}`,
    ...(post.tags.length ? [`  subjects: ${post.tags.join(", ")}`] : []),
  ])

  const body = [
    "# llms.txt",
    "",
    "site: art.krixnx.xyz",
    "name: Krishna Kant Maharshi portfolio",
    "creator: Krishna Kant Maharshi",
    "alternate_name: kantcancook, kant can cook, psyx",
    "role: visual designer and creative",
    `official_website: ${SITE_URL}`,
    `official_instagram: ${CREATOR_INSTAGRAM}`,
    `writing_series: ${BLOG_NAME}`,
    `writing_aliases: ${BLOG_ALIASES.join(", ")}`,
    `writing_url: ${SITE_URL}/blog`,
    "",
    "summary: Official creative portfolio for Krishna Kant Maharshi (kantcancook), including Kezual Talks w Kant (KTWK) interviews and writing.",
    "facts:",
    "- Krishna Kant Maharshi, kantcancook, kant can cook, and psyx refer to the same creator identity.",
    "- art.krixnx.xyz is the official portfolio.",
    "- instagram.com/kantcancook is the official Instagram profile.",
    `- ${BLOG_NAME} (KTWK) is the interview and writing series published at ${SITE_URL}/blog.`,
    "- Work focuses on posters, cover artwork, campaigns, writing, and visual direction across music, film, apparel, and culture.",
    "",
    "published_conversations:",
    ...(postLines.length ? postLines : ["- none indexed yet"]),
  ].join("\n")

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
