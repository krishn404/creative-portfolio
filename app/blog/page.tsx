import type { Metadata } from "next"
import Link from "next/link"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import { BLOG_DESCRIPTION, BLOG_NAME, SITE_URL } from "@/lib/seo/constants"
import { buildBlogJsonLd } from "@/lib/seo/schema"
import { BlogListing } from "@/components/blog/BlogListing"
import { JsonLd } from "@/components/seo/JsonLd"
import { toBlogPostCard, type BlogPost, type BlogPostCard } from "@/lib/blog/utils"

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: `${BLOG_NAME} (KTWK) | Interviews` },
    description: BLOG_DESCRIPTION.slice(0, 159),
    alternates: { canonical: `${SITE_URL}/blog`, types: { "application/rss+xml": "/blog/rss.xml" } },
    openGraph: { type: "website", title: `${BLOG_NAME} (KTWK)`, description: BLOG_DESCRIPTION, url: `${SITE_URL}/blog`, images: [{ url: `${SITE_URL}/api/og?title=Kezual%20Talks%20w%20Kant&subtitle=KTWK%20interviews`, width: 1200, height: 630, alt: "Kezual Talks w Kant interview series" }] },
    twitter: { card: "summary_large_image", title: `${BLOG_NAME} (KTWK)`, description: BLOG_DESCRIPTION, images: [`${SITE_URL}/api/og?title=Kezual%20Talks%20w%20Kant&subtitle=KTWK%20interviews`] },
  }
}

export default async function BlogPage() {
  let posts: BlogPostCard[] = []
  try {
    const published = await convex.query(api.posts.getPublishedPosts) as BlogPost[]
    posts = published.map(toBlogPostCard)
  } catch (error) {
    console.error("Failed to fetch blog posts:", error)
  }

  return (
    <>
      <JsonLd data={buildBlogJsonLd(posts)} />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm">
          <Link href="/" className="underline">Home</Link><span aria-hidden="true"> / </span><span>{BLOG_NAME}</span>
        </nav>
        <BlogListing posts={posts} />
      </div>
    </>
  )
}
