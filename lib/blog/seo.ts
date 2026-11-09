import { buildMetaDescription, buildTldr, inferArticleType, plainTextFromContent } from "@/convex/postText"
import { slugify, type ArticleType, type BlogPost } from "@/lib/blog/utils"

export function postTopics(post: Pick<BlogPost, "tags"> & Partial<Pick<BlogPost, "keywords">>): string[] {
  return Array.from(
    new Set([...(post.tags ?? []), ...(post.keywords ?? [])].map((item) => item.trim()).filter(Boolean)),
  )
}

export function tagPath(tag: string) {
  return `/blog/tag/${slugify(tag)}`
}

export function postsForTag(posts: BlogPost[], tag: string) {
  const key = slugify(tag)
  return posts.filter((post) => postTopics(post).some((topic) => slugify(topic) === key))
}

export function displayExcerpt(post: BlogPost) {
  if (post.excerpt.trim() && post.excerpt.trim() !== post.title.trim()) return post.excerpt.trim()
  const fromBody = plainTextFromContent(post.content)
  return (fromBody || post.excerpt || post.title).replace(/\s+/g, " ").trim()
}

export function displayDescription(post: BlogPost) {
  const custom = post.metaDescription?.trim()
  return custom ? custom.replace(/\s+/g, " ") : buildMetaDescription(displayExcerpt(post), post.title)
}

export function displayTldr(post: BlogPost) {
  return post.tldr?.trim() || buildTldr(post.content, post.guestName, articleTypeOf(post))
}

export function articleTypeOf(post: Partial<BlogPost>): ArticleType {
  return inferArticleType(post)
}

export function articleTypeLabel(type: ArticleType) {
  if (type === "interview") return "Interview"
  if (type === "review") return "Review"
  return "Article"
}

export function summaryHeading(post: Partial<BlogPost>) {
  const type = articleTypeOf(post)
  const subject = post.guestName?.trim()
  if (type === "interview") return subject ? `In this interview with ${subject}` : "In this interview"
  if (type === "review") return subject ? `About this ${subject} review` : "About this review"
  return "About this article"
}

export function defaultSeoTitle(post: Partial<BlogPost> & Pick<BlogPost, "title">) {
  const title = post.title.trim()
  const subject = post.guestName?.trim()
  const type = articleTypeOf(post)
  if (!subject || type === "article") return title
  if (/\b(interview|review)\b/i.test(title)) return title

  const escaped = subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const topic = title
    .replace(new RegExp(`^${escaped}\\s*(?:[:—-]|on|talks? about|shares about|is)?\\s*`, "i"), "")
    .replace(/[.\s]+$/, "")
    .trim()
  if (type === "interview") return topic ? `${subject} Interview: ${topic}` : `${subject} Interview`
  return topic ? `${subject}: ${topic} Review` : `${subject} Review`
}

export function documentTitle(post: Partial<BlogPost> & Pick<BlogPost, "title">) {
  const headline = (post.seoTitle?.trim() || defaultSeoTitle(post)).trim()
  return /(?:^|\s)[|—-]\s*KTWK$/i.test(headline) ? headline : `${headline} | KTWK`
}

export function isIndexableTag(posts: BlogPost[], tag: string) {
  return postsForTag(posts, tag).length >= 2
}

function contentImagesMissingAlt(content: string) {
  try {
    let missing = 0
    const visit = (node: unknown) => {
      if (!node || typeof node !== "object") return
      const value = node as { type?: string; attrs?: { alt?: unknown }; content?: unknown[] }
      if (value.type === "image" && (typeof value.attrs?.alt !== "string" || !value.attrs.alt.trim())) missing += 1
      value.content?.forEach(visit)
    }
    visit(JSON.parse(content))
    return missing
  } catch {
    return 0
  }
}

export function relatedPosts(posts: BlogPost[], current: BlogPost, limit = 3) {
  const topics = new Set(postTopics(current).map((topic) => topic.toLowerCase()))
  const guest = current.guestName?.trim().toLowerCase()

  return posts
    .filter((post) => post.slug !== current.slug)
    .map((post) => {
      const shared = postTopics(post).filter((topic) => topics.has(topic.toLowerCase())).length
      const sameGuest = guest && post.guestName?.trim().toLowerCase() === guest ? 2 : 0
      return { post, score: shared + sameGuest }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (b.post.publishedAt ?? 0) - (a.post.publishedAt ?? 0))
    .slice(0, limit)
    .map((item) => item.post)
}

export function allTags(posts: BlogPost[]) {
  const tags = new Map<string, string>()
  for (const post of posts) {
    for (const topic of postTopics(post)) {
      tags.set(slugify(topic), topic)
    }
  }
  return Array.from(tags.entries()).map(([slug, label]) => ({ slug, label }))
}

export function seoWarnings(input: {
  title: string
  seoTitle: string
  metaDescription: string
  excerpt: string
  tldr: string
  guestName: string
  articleType: ArticleType
  subjectAliases: string[]
  subjectSameAs: string[]
  keywords: string[]
  ogImageAlt: string
  hasCover: boolean
  content: string
}) {
  const warnings: string[] = []
  const headline = input.seoTitle.trim() || input.title.trim()
  const patterned = `${headline} | KTWK`
  if (!input.excerpt.trim()) warnings.push("Excerpt is empty. A short summary will be generated from the body.")
  if (input.excerpt.trim() === input.title.trim()) warnings.push("Excerpt repeats the title. Add a factual summary of this specific piece.")
  if (!input.metaDescription.trim()) warnings.push("Meta description is empty. A deterministic description will be generated from the excerpt.")
  if (input.metaDescription.trim().length > 180) warnings.push("The description may be shortened in some search results; keep the most useful details near the start.")
  if (patterned.length > 65) warnings.push("The search title may be shortened on narrow results; keep the artist and distinctive topic near the start.")
  if (!input.tldr.trim()) warnings.push("TL;DR is empty. A short summary will be generated from the body.")
  const tldrWords = input.tldr.trim().split(/\s+/).filter(Boolean).length
  if (input.tldr.trim() && (tldrWords < 40 || tldrWords > 60)) warnings.push("TL;DR should contain 40 to 60 words.")
  if (input.articleType !== "article" && !input.guestName.trim()) warnings.push(`Artist or subject name is empty for this ${input.articleType}.`)
  if (input.guestName.trim() && input.guestName.trim().length < 2) warnings.push("Artist or subject name looks incomplete.")
  if (input.keywords.length === 0) warnings.push("No additional topics are set. Add only meaningful names or subjects not already covered by tags.")
  if (input.subjectAliases.some((alias) => alias.toLowerCase() === input.guestName.trim().toLowerCase())) warnings.push("An alias duplicates the primary artist or subject name.")
  if (input.subjectSameAs.length && !input.guestName.trim()) warnings.push("Verified identity links need an artist or subject name.")
  if (input.hasCover && input.ogImageAlt.trim().length < 5) warnings.push("Cover image alt text is empty or too vague.")
  const missingInlineAlt = contentImagesMissingAlt(input.content)
  if (missingInlineAlt) warnings.push(`${missingInlineAlt} inline image${missingInlineAlt === 1 ? " is" : "s are"} missing descriptive alt text.`)
  return warnings
}
