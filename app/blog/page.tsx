import type { Metadata } from "next"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import { buildMetadata } from "@/lib/seo/metadata"
import { BlogListing } from "@/components/blog/BlogListing"
import type { BlogPost } from "@/lib/blog/utils"

export const metadata: Metadata = buildMetadata({
  title: "Writing | kantcancook",
  description: "Essays on design, development, music, and creative process by kantcancook.",
  path: "/blog",
})

export default async function BlogPage() {
  let posts: BlogPost[] = []
  try {
    posts = await convex.query(api.posts.getPublishedPosts)
  } catch (error) {
    console.error("Failed to fetch blog posts:", error)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <BlogListing posts={posts} />
    </div>
  )
}
