import { buildMetaDescription, buildTldr, clampSentence, plainTextFromContent } from "@/convex/postText"
import { slugify, type BlogPost } from "@/lib/blog/utils"

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
  return custom ? clampSentence(custom, 160) : buildMetaDescription(displayExcerpt(post), post.title)
}

export function displayTldr(post: BlogPost) {
  return post.tldr?.trim() || buildTldr(post.content, post.guestName)
}

export function documentTitle(post: BlogPost) {
  const headline = (post.seoTitle?.trim() || post.title).trim()
  return `${headline} | KTWK`
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
  if (!input.metaDescription.trim()) warnings.push("Meta description is empty. Search results will use the excerpt.")
  if (input.metaDescription.trim().length > 160) warnings.push("Meta description is over 160 characters.")
  if (input.metaDescription.trim() && input.metaDescription.trim().length < 150) warnings.push("Meta description is under 150 characters.")
  if (patterned.length > 60) warnings.push("The search title is over 60 characters. Add a shorter SEO title.")
  if (!input.tldr.trim()) warnings.push("TL;DR is empty. A short summary will be generated from the body.")
  const tldrWords = input.tldr.trim().split(/\s+/).filter(Boolean).length
  if (input.tldr.trim() && (tldrWords < 40 || tldrWords > 60)) warnings.push("TL;DR should contain 40 to 60 words.")
  if (!input.guestName.trim()) warnings.push("Guest name is empty. Add it when this post is an interview.")
  if (input.guestName.trim() && input.guestName.trim().length < 3) warnings.push("Guest name looks incomplete.")
  if (input.keywords.length === 0) warnings.push("No keywords are set. Add the main topics and names.")
  if (input.hasCover && input.ogImageAlt.trim().length < 5) warnings.push("Cover image alt text is empty or too vague.")
  const missingInlineAlt = contentImagesMissingAlt(input.content)
  if (missingInlineAlt) warnings.push(`${missingInlineAlt} inline image${missingInlineAlt === 1 ? " is" : "s are"} missing descriptive alt text.`)
  return warnings
}
