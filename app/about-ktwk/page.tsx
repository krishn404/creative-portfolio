import type { Metadata } from "next"
import Link from "next/link"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import { SITE_URL, BLOG_NAME } from "@/lib/seo/constants"
import type { BlogPost } from "@/lib/blog/utils"
import { JsonLd } from "@/components/seo/JsonLd"

export const revalidate = 3600
export const metadata: Metadata = {
  title: { absolute: "What is KTWK? | Kezual Talks w Kant" },
  description: "KTWK, short for Kezual Talks w Kant, is Krishna Kant Maharshi's interview and writing series about artists, music, and culture.",
  alternates: { canonical: `${SITE_URL}/about-ktwk`, types: { "application/rss+xml": "/blog/rss.xml" } },
  openGraph: { type: "website", title: "What is KTWK? | Kezual Talks w Kant", description: "The story and latest conversations from KTWK, hosted by Krishna Kant Maharshi.", url: `${SITE_URL}/about-ktwk` },
}

export default async function AboutKtwkPage() {
  let posts: BlogPost[] = []
  try { posts = await convex.query(api.posts.getPublishedPosts) } catch (error) { console.error("Failed to load KTWK posts:", error) }
  return <>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "CreativeWorkSeries", "@id": `${SITE_URL}/about-ktwk#series`, name: BLOG_NAME, alternateName: "KTWK", description: "An interview and writing series about artists, music, and culture, hosted by Krishna Kant Maharshi, also known as Kantcancook and Psyx.", url: `${SITE_URL}/about-ktwk`, creator: { "@type": "Person", name: "Krishna Kant Maharshi", alternateName: ["Kantcancook", "Psyx"] }, hasPart: posts.map((post) => ({ "@type": "BlogPosting", headline: post.title, url: `${SITE_URL}/blog/${post.slug}` })) }} />
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm"><Link href="/blog" className="underline">Kezual Talks w Kant interviews</Link> / About KTWK</nav>
      <h1 className="blog-font-headline text-4xl font-semibold sm:text-6xl">What is KTWK?</h1>
      <p className="mt-6 text-lg leading-relaxed"><strong>KTWK</strong> means <strong>Kezual Talks w Kant</strong>, an interview and writing series hosted by Krishna Kant Maharshi, also known as Kantcancook and Psyx. The series shares conversations with artists and people shaping music and culture, alongside notes and reviews from the host.</p>
      <p className="mt-4 leading-relaxed">Each conversation gives guests room to talk about their work, influences, process, and the ideas behind what they make. Browse the latest writing below.</p>
      <h2 className="mt-10 text-2xl font-semibold">All KTWK posts</h2>
      <ul className="mt-4 space-y-3">{posts.map((post) => <li key={post.slug}><Link className="underline" href={`/blog/${post.slug}`}>{post.title}</Link>{post.guestName ? `, with ${post.guestName}` : ""}</li>)}</ul>
    </main>
  </>
}
