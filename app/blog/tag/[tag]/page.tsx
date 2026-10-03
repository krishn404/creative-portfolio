import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import { SITE_URL } from "@/lib/seo/constants"
import { allTags, postsForTag, tagPath } from "@/lib/blog/seo"
import { PostGrid } from "@/components/blog/PostGrid"
import { JsonLd } from "@/components/seo/JsonLd"
import type { BlogPost } from "@/lib/blog/utils"

type Props = { params: Promise<{ tag: string }> }
async function getPosts(): Promise<BlogPost[]> {
  try { return await convex.query(api.posts.getPublishedPosts) } catch { return [] }
}
export const revalidate = 3600

export async function generateStaticParams() {
  return allTags(await getPosts()).map(({ slug }) => ({ tag: slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params
  const posts = await getPosts()
  const label = allTags(posts).find((item) => item.slug === tag)?.label
  if (!label) return { title: "Tag not found", robots: { index: false, follow: false } }
  const title = `${label.slice(0, 42)} | KTWK topics`
  const description = `Kezual Talks w Kant interviews and writing about ${label}.`.slice(0, 159)
  return { title: { absolute: title }, description, alternates: { canonical: `${SITE_URL}${tagPath(label)}`, types: { "application/rss+xml": "/blog/rss.xml" } }, openGraph: { type: "website", title, description }, twitter: { card: "summary_large_image", title, description } }
}

export default async function BlogTagPage({ params }: Props) {
  const { tag } = await params
  const posts = await getPosts()
  const label = allTags(posts).find((item) => item.slug === tag)?.label
  if (!label) notFound()
  const tagged = postsForTag(posts, label)
  return <>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "All KTWK interviews", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 2, name: label, item: `${SITE_URL}${tagPath(label)}` },
    ] }} />
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="mb-4 text-sm"><Link href="/blog" className="underline">All KTWK interviews</Link> / {label}</p>
      <p className="blog-font-mono text-[10px] tracking-[0.2em] text-[var(--text-secondary)]">[TOPIC]</p>
      <hr className="my-4 border-black" />
      <h1 className="blog-font-headline text-5xl font-semibold sm:text-7xl">{label}</h1>
      <p className="mt-5 max-w-2xl text-base leading-relaxed">Kezual Talks w Kant conversations and writing about {label}.</p>
      <hr className="my-8 border-black" />
      <PostGrid posts={tagged} />
    </div>
  </>
}
