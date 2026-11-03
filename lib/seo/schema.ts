import {
  BLOG_ALIASES,
  BLOG_DESCRIPTION,
  BLOG_NAME,
  CREATOR_ALIASES,
  CREATOR_INSTAGRAM,
  CREATOR_PINTEREST,
  CREATOR_NAME,
  KNOWS_ABOUT,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo/constants"
import type { BlogPost, BlogPostCard } from "@/lib/blog/utils"
import { displayDescription, postTopics } from "@/lib/blog/seo"
import { plainTextFromContent } from "@/convex/postText"

type JsonLd = Record<string, unknown>

const personId = `${SITE_URL}#person`

function personNode() {
  return {
    "@type": "Person",
    "@id": personId,
    name: CREATOR_NAME,
    alternateName: [...CREATOR_ALIASES],
    url: SITE_URL,
    image: `${SITE_URL}/api/og?title=kantcancook%20Artist`,
    description:
      "Krishna Kant Maharshi, also known as kantcancook and psyx, is a visual designer and creative working across music, film, culture, and apparel.",
    sameAs: [CREATOR_INSTAGRAM, CREATOR_PINTEREST, SITE_URL],
    jobTitle: "Visual Designer",
    knowsAbout: [...KNOWS_ABOUT],
  }
}

function subjectFromTitle(title: string): string | undefined {
  const match = title.match(/^([A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){0,3})\b/)
  const name = match?.[1]?.trim()
  if (!name || name.length < 3) return undefined
  return name
}

export function articleKeywords(post: Pick<BlogPost, "title" | "tags"> & Partial<Pick<BlogPost, "keywords" | "guestName">>): string[] {
  const subject = post.guestName?.trim() || subjectFromTitle(post.title)
  return Array.from(
    new Set(
      [
        post.title,
        subject,
        ...postTopics(post),
        CREATOR_NAME,
        ...CREATOR_ALIASES,
        BLOG_NAME,
        ...BLOG_ALIASES,
      ].filter((value): value is string => Boolean(value)),
    ),
  )
}

export function buildPortfolioJsonLd(): JsonLd[] {
  const websiteId = `${SITE_URL}#website`
  const profilePageId = `${SITE_URL}#profile`
  const galleryPageId = `${SITE_URL}#gallery`

  return [
    {
      "@context": "https://schema.org",
      ...personNode(),
      mainEntityOfPage: profilePageId,
    },
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "@id": profilePageId,
      url: SITE_URL,
      name: `${CREATOR_NAME} profile`,
      isPartOf: { "@id": websiteId },
      mainEntity: { "@id": personId },
      about: { "@id": personId },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": websiteId,
      url: SITE_URL,
      name: SITE_NAME,
      alternateName: [...CREATOR_ALIASES, BLOG_NAME, ...BLOG_ALIASES],
      description:
        "Visual design, posters, cover art, campaigns, writing, and creative direction by Krishna Kant Maharshi, also known as kantcancook.",
      publisher: { "@id": personId },
      author: { "@id": personId },
      creator: { "@id": personId },
      inLanguage: "en",
    },
    {
      "@context": "https://schema.org",
      "@type": "CreativeWorkSeries",
      "@id": `${SITE_URL}/about-ktwk#series`,
      name: BLOG_NAME,
      alternateName: [...BLOG_ALIASES],
      description: BLOG_DESCRIPTION,
      url: `${SITE_URL}/about-ktwk`,
      creator: { "@id": personId },
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": galleryPageId,
      url: SITE_URL,
      name: "Selected visual works",
      isPartOf: { "@id": websiteId },
      about: { "@id": personId },
      creator: { "@id": personId },
      mainEntity: {
        "@type": "ImageGallery",
        "@id": `${SITE_URL}#image-gallery`,
        name: "Selected work by Krishna Kant Maharshi",
        url: SITE_URL,
        creator: { "@id": personId },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      "@id": `${SITE_URL}/blog#blog`,
      name: BLOG_NAME,
      alternateName: [...BLOG_ALIASES],
      description: BLOG_DESCRIPTION,
      url: `${SITE_URL}/blog`,
      inLanguage: "en",
      author: { "@id": personId },
      publisher: { "@id": personId },
    },
  ]
}

export function buildSiteIdentityJsonLd(): JsonLd[] {
  const websiteId = `${SITE_URL}#website`
  return [
    { "@context": "https://schema.org", ...personNode() },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": websiteId,
      url: SITE_URL,
      name: SITE_NAME,
      alternateName: [...CREATOR_ALIASES],
      publisher: { "@id": personId },
      inLanguage: "en",
    },
    {
      "@context": "https://schema.org",
      "@type": "CreativeWorkSeries",
      "@id": `${SITE_URL}/about-ktwk#series`,
      name: BLOG_NAME,
      alternateName: [...BLOG_ALIASES],
      description: BLOG_DESCRIPTION,
      url: `${SITE_URL}/about-ktwk`,
      creator: { "@id": personId },
      isPartOf: { "@id": websiteId },
    },
  ]
}

export function buildBlogJsonLd(posts: BlogPostCard[]): JsonLd[] {
  return [
    {
      "@context": "https://schema.org",
      ...personNode(),
    },
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      "@id": `${SITE_URL}/blog#blog`,
      name: BLOG_NAME,
      alternateName: [...BLOG_ALIASES],
      description: BLOG_DESCRIPTION,
      url: `${SITE_URL}/blog`,
      inLanguage: "en",
      author: personNode(),
      publisher: personNode(),
      blogPost: posts.map((post) => ({
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        url: `${SITE_URL}/blog/${post.slug}`,
        datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
        keywords: articleKeywords(post).join(", "),
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: BLOG_NAME, item: `${SITE_URL}/blog` },
      ],
    },
  ]
}

export function buildBlogPostingJsonLd(post: BlogPost, image: string): JsonLd[] {
  const url = `${SITE_URL}/blog/${post.slug}`
  const publishedAt = post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined
  const subject = post.guestName?.trim()
  const about = [
    ...(subject ? [{ "@type": "Person", name: subject }] : []),
    ...postTopics(post).map((tag) => ({ "@type": "Thing", name: tag })),
  ]

  return [
    {
      "@context": "https://schema.org",
      ...personNode(),
    },
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      headline: post.title,
      description: displayDescription(post),
      image: [image],
      url,
      datePublished: publishedAt,
      dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : publishedAt,
      inLanguage: "en",
      keywords: articleKeywords(post).join(", "),
      articleSection: BLOG_NAME,
      wordCount: plainTextFromContent(post.content).split(/\s+/).filter(Boolean).length,
      isAccessibleForFree: true,
      about: about.length ? about : undefined,
      author: personNode(),
      publisher: personNode(),
      mentions: post.guestName ? [{ "@type": "Person", name: post.guestName }] : undefined,
      isPartOf: {
        "@type": "CreativeWorkSeries",
        "@id": `${SITE_URL}/about-ktwk#series`,
        name: BLOG_NAME,
        alternateName: [...BLOG_ALIASES],
        url: `${SITE_URL}/about-ktwk`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: BLOG_NAME, item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ]
}
