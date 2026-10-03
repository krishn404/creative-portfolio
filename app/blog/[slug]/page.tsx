import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound, permanentRedirect } from "next/navigation"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import { SITE_URL, BLOG_NAME } from "@/lib/seo/constants"
import { articleKeywords, buildBlogPostingJsonLd, buildFaqJsonLd } from "@/lib/seo/schema"
import { renderPostContent } from "@/lib/blog/render-content"
import { BlogPostContent } from "@/components/blog/BlogPostContent"
import { getCoverOgUrl, getCoverPreviewUrl } from "@/lib/cloudinary-upload"
import { PostMeta } from "@/components/blog/PostMeta"
import { ReadingProgress } from "@/components/blog/ReadingProgress"
import { IncrementViews } from "@/components/blog/IncrementViews"
import type { BlogPost } from "@/lib/blog/utils"
import { JsonLd } from "@/components/seo/JsonLd"
import { displayDescription, displayTldr, documentTitle, postTopics, relatedPosts, tagPath } from "@/lib/blog/seo"

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

export async function generateStaticParams() {
  const posts = await getAllPublished()
  return posts.map((post) => ({ slug: post.slug }))
}

export const revalidate = 3600

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: "Post not found", robots: { index: false, follow: false } }

  const ogImage = post.coverImage
    ? getCoverOgUrl(post.coverImage)
    : `${SITE_URL}/api/og?title=${encodeURIComponent(post.title)}&subtitle=${encodeURIComponent(post.excerpt)}`
  const keywords = Array.from(new Set([...articleKeywords(post), ...postTopics(post)]))
  const description = displayDescription(post)
  const title = documentTitle(post)

  return {
    title: { absolute: title },
    description,
    keywords,
    alternates: {
      canonical: `${SITE_URL}/blog/${post.slug}`,
      types: { "application/rss+xml": "/blog/rss.xml" },
    },
    authors: [{ name: "Krishna Kant Maharshi", url: SITE_URL }],
    openGraph: {
      title,
      description,
      type: "article",
      url: `${SITE_URL}/blog/${post.slug}`,
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      authors: ["Krishna Kant Maharshi"],
      tags: keywords,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.ogImageAlt || post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const [post, allPosts] = await Promise.all([getPost(slug), getAllPublished()])

  if (!post) {
    try {
      const target = await convex.query(api.posts.getRedirectTarget, { slug })
      if (target) permanentRedirect(`/blog/${target}`)
    } catch (error) { console.error("Failed to resolve old post slug:", error) }
    notFound()
  }

  const html = renderPostContent(post.content).replace(/<h1(\s|>)/gi, "<h2$1").replace(/<\/h1>/gi, "</h2>")
  const ogImage = post.coverImage
    ? getCoverOgUrl(post.coverImage)
    : `${SITE_URL}/api/og?title=${encodeURIComponent(post.title)}&subtitle=${encodeURIComponent(post.excerpt)}`
  const currentIndex = allPosts.findIndex((p) => p.slug === slug)
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null
  const related = relatedPosts(allPosts, post)
  const faqJsonLd = buildFaqJsonLd(post)

  return (
    <>
      <JsonLd data={[...buildBlogPostingJsonLd(post, ogImage), ...(faqJsonLd ? [faqJsonLd] : [])]} />
      <ReadingProgress />
      <IncrementViews slug={slug} />
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/blog"
          className="blog-font-mono inline-flex min-h-10 items-center text-xs tracking-wider hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          ← {BLOG_NAME}
        </Link>
        <nav aria-label="Breadcrumb" className="blog-font-mono mt-3 text-xs">
          <Link href="/about-ktwk" className="underline">About KTWK</Link>
          <span aria-hidden="true"> / </span><Link href="/blog" className="underline">All interviews</Link>
          <span aria-hidden="true"> / </span><span>{post.title}</span>
        </nav>
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
              alt={post.ogImageAlt || post.title}
              width={1200}
              height={675}
              className="h-auto w-full object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        <section aria-labelledby="interview-summary" className="mb-8 border-y border-black py-5">
          <h2 id="interview-summary" className="blog-font-mono mb-2 text-xs tracking-wider">IN THIS INTERVIEW</h2>
          <p className="blog-font-body leading-relaxed">{displayTldr(post)}</p>
        </section>

        <BlogPostContent html={html} className="blog-prose prose max-w-none" />

        {!!post.faq?.length && <section className="blog-prose prose mt-10 max-w-none" aria-labelledby="faq-heading">
          <h2 id="faq-heading">Frequently asked questions</h2>
          {post.faq.map((item, index) => <div key={`${item.q}-${index}`}><h3>{item.q}</h3><p>{item.a}</p></div>)}
        </section>}

        <p className="mt-8 text-sm">Read more <Link className="underline" href="/blog">Kezual Talks w Kant interviews</Link> or learn <Link className="underline" href="/about-ktwk">what KTWK is</Link>.</p>
        {postTopics(post).length > 0 && <div className="mt-5 flex flex-wrap gap-2">{postTopics(post).map((tag) => <Link key={tag} href={tagPath(tag)} className="blog-font-mono border border-black px-2 py-1 text-xs underline">{tag}</Link>)}</div>}
        {related.length > 0 && <section className="mt-10" aria-labelledby="related-heading"><h2 id="related-heading" className="blog-font-headline text-2xl">Related conversations</h2><ul className="mt-3 list-disc pl-5">{related.map((item) => <li key={item.slug}><Link className="underline" href={`/blog/${item.slug}`}>{item.title}</Link></li>)}</ul></section>}

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
