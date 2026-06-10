import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import { SITE_URL } from "@/lib/seo/constants"
import { renderPostContent } from "@/lib/blog/render-content"
import { getCoverPreviewUrl } from "@/lib/cloudinary-upload"
import { PostMeta } from "@/components/blog/PostMeta"
import { ReadingProgress } from "@/components/blog/ReadingProgress"
import { IncrementViews } from "@/components/blog/IncrementViews"
import type { BlogPost } from "@/lib/blog/utils"

type PageProps = {
  params: Promise<{ slug: string }>
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    return await convex.query(api.posts.getPostBySlug, { slug })
  } catch {
    return null
  }
}

async function getAllPublished(): Promise<BlogPost[]> {
  try {
    return await convex.query(api.posts.getPublishedPosts)
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: "Post not found" }

  const ogImage = post.coverImage
    ? post.coverImage
    : `${SITE_URL}/api/og?title=${encodeURIComponent(post.title)}&subtitle=${encodeURIComponent(post.excerpt)}`

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: `${SITE_URL}/blog/${post.slug}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const [post, allPosts] = await Promise.all([getPost(slug), getAllPublished()])

  if (!post) notFound()

  const html = renderPostContent(post.content)
  const currentIndex = allPosts.findIndex((p) => p.slug === slug)
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null

  return (
    <>
      <ReadingProgress />
      <IncrementViews slug={slug} />
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/blog"
          className="blog-font-mono inline-flex min-h-10 items-center text-xs tracking-wider hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          ← Off the Record
        </Link>
        <hr className="my-6 border-black" />

        <div className="mb-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="blog-font-mono border border-black px-2 py-0.5 text-[9px] tracking-wider">
              [{tag}]
            </span>
          ))}
        </div>

        <h1 className="blog-font-headline text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
          {post.title}
        </h1>
        <hr className="my-6 border-black" />
        <PostMeta publishedAt={post.publishedAt} readTime={post.readTime} views={post.views} />
        <hr className="my-8 border-black" />

        {post.coverImage && (
          <div className="relative mb-10 aspect-[16/9] w-full border border-black">
            <Image
              src={getCoverPreviewUrl(post.coverImage)}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        <div
          className="blog-prose prose max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <hr className="my-10 border-black" />

        <nav className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          {prevPost ? (
            <Link
              href={`/blog/${prevPost.slug}`}
              className="blog-font-headline max-w-[45%] text-sm font-medium hover:underline"
            >
              ← {prevPost.title}
            </Link>
          ) : (
            <span />
          )}
          {nextPost && (
            <Link
              href={`/blog/${nextPost.slug}`}
              className="blog-font-headline max-w-[45%] text-right text-sm font-medium hover:underline sm:ml-auto"
            >
              {nextPost.title} →
            </Link>
          )}
        </nav>
      </article>
    </>
  )
}
