import type { Metadata } from "next"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import { buildMetadata } from "@/lib/seo/metadata"
import { BLOG_DESCRIPTION, BLOG_NAME } from "@/lib/seo/constants"
import { buildBlogJsonLd } from "@/lib/seo/schema"
import { BlogListing } from "@/components/blog/BlogListing"
import { JsonLd } from "@/components/seo/JsonLd"
import type { BlogPost } from "@/lib/blog/utils"

export const revalidate = 3600

export const metadata: Metadata = buildMetadata({
  title: BLOG_NAME,
  description: BLOG_DESCRIPTION,
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
    <>
      <JsonLd data={buildBlogJsonLd(posts)} />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <BlogListing posts={posts} />
      </div>
    </>
  )
}
