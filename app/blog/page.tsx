import type { Metadata } from "next"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import { buildMetadata } from "@/lib/seo/metadata"
import { PostGrid } from "@/components/blog/PostGrid"
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
      <p className="blog-font-mono text-[10px] tracking-[0.2em] text-[var(--text-secondary)]">[BLOG]</p>
      <hr className="my-4 border-black" />
      <h1 className="blog-font-headline glitch text-5xl font-semibold sm:text-7xl md:text-8xl lg:text-[96px]">
        WRITING.
      </h1>
      <hr className="my-8 border-black" />
      <PostGrid posts={posts} />
    </div>
  )
}
