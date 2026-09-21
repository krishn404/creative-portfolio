import {
  BLOG_ALIASES,
  BLOG_DESCRIPTION,
  BLOG_NAME,
  CREATOR_ALIASES,
  CREATOR_INSTAGRAM,
  CREATOR_NAME,
  KNOWS_ABOUT,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo/constants"
import type { BlogPost } from "@/lib/blog/utils"

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
    sameAs: [CREATOR_INSTAGRAM, SITE_URL],
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

export function articleKeywords(post: BlogPost): string[] {
  const subject = subjectFromTitle(post.title)
  return Array.from(
    new Set(
      [
        post.title,
        subject,
        ...post.tags,
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
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${SITE_URL}#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "Who is kantcancook?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "kantcancook, also known as Krishna Kant Maharshi and psyx, is a visual designer and creative. The official portfolio is https://art.krixnx.xyz.",
          },
        },
        {
          "@type": "Question",
          name: "What is Kezual Talks w Kant?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Kezual Talks w Kant (KTWK) is the interview and writing series by kantcancook, published at https://art.krixnx.xyz/blog.",
          },
        },
        {
          "@type": "Question",
          name: "What is the official Instagram of kantcancook?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The official Instagram profile is https://instagram.com/kantcancook.",
          },
        },
      ],
    },
  ]
}

export function buildBlogJsonLd(posts: BlogPost[]): JsonLd[] {
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
  ]
}

export function buildBlogPostingJsonLd(post: BlogPost, image: string): JsonLd[] {
  const url = `${SITE_URL}/blog/${post.slug}`
  const publishedAt = post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined
  const subject = subjectFromTitle(post.title)
  const about = [
    ...(subject ? [{ "@type": "Person", name: subject }] : []),
    ...post.tags.map((tag) => ({ "@type": "Thing", name: tag })),
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
      description: post.excerpt,
      image,
      url,
      datePublished: publishedAt,
      dateModified: publishedAt,
      inLanguage: "en",
      keywords: articleKeywords(post).join(", "),
      articleSection: BLOG_NAME,
      about: about.length ? about : undefined,
      author: personNode(),
      publisher: personNode(),
      isPartOf: {
        "@type": "Blog",
        "@id": `${SITE_URL}/blog#blog`,
        name: BLOG_NAME,
        alternateName: [...BLOG_ALIASES],
        url: `${SITE_URL}/blog`,
      },
    },
  ]
}
