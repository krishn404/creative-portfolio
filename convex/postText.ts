const SERIES_NAME = "Kezual Talks w Kant"

export type ArticleType = "interview" | "review" | "article"

function collectText(value: unknown): string {
  if (!value || typeof value !== "object") return ""
  const node = value as { text?: unknown; content?: unknown }
  const own = typeof node.text === "string" ? node.text : ""
  const nested = Array.isArray(node.content) ? node.content.map(collectText).join(" ") : ""
  return `${own} ${nested}`.replace(/\s+/g, " ").trim()
}

export function plainTextFromContent(content: string): string {
  try {
    return collectText(JSON.parse(content))
  } catch {
    return ""
  }
}

export function clampSentence(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  const slice = clean.slice(0, max + 1)
  const lastSpace = slice.lastIndexOf(" ")
  const cut = (lastSpace > 80 ? slice.slice(0, lastSpace) : clean.slice(0, max)).trim()
  return cut.replace(/[.,;:]+$/, "")
}

export function buildExcerptFromBody(content: string, title: string): string {
  const text = plainTextFromContent(content)
  return clampSentence(text || title, 160)
}

export function buildMetaDescription(excerpt: string, title: string): string {
  const source = excerpt.trim() || title.trim()
  const clean = source.replace(/[.\s]+$/, "")
  const suffix = " Read on Kezual Talks w Kant (KTWK)."
  return clean.length + suffix.length <= 180 ? `${clean}.${suffix}` : clean
}

export function buildTldr(content: string, guestName?: string, articleType: ArticleType = "article"): string {
  const words = plainTextFromContent(content).split(/\s+/).filter(Boolean)
  const guest = guestName?.trim()
  const lead = articleType === "interview" && guest
    ? `In this KTWK interview, Krishna Kant Maharshi talks with ${guest}.`
    : articleType === "review"
      ? "In this KTWK review, Krishna Kant Maharshi looks closely at the work."
      : "In this KTWK article, Krishna Kant Maharshi introduces the subject."
  const leadWords = lead.split(/\s+/).filter(Boolean)
  const room = Math.max(0, 55 - leadWords.length)
  return [...leadWords, ...words.slice(0, room)].slice(0, 60).join(" ")
}

export function inferArticleType(input: {
  articleType?: ArticleType
  title?: string
  slug?: string
  tags?: string[]
  guestName?: string
}): ArticleType {
  if (input.articleType) return input.articleType
  const searchable = [input.title, input.slug, ...(input.tags ?? [])].filter(Boolean).join(" ").toLowerCase()
  if (/\breview\b/.test(searchable)) return "review"
  if (input.guestName?.trim()) return "interview"
  return "article"
}

export function defaultSeries(series?: string) {
  const value = series?.trim()
  return value || SERIES_NAME
}
