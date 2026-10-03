const SERIES_NAME = "Kezual Talks w Kant"

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
  const expanded = `${source}. Kezual Talks w Kant (KTWK) shares interviews about artists, their work, influences, creative process, and ideas shaping culture. Read this conversation for more context.`
  return clampSentence(expanded, 160)
}

export function buildTldr(content: string, guestName?: string): string {
  const words = plainTextFromContent(content).split(/\s+/).filter(Boolean)
  const guest = guestName?.trim()
  const lead = guest
    ? `In this conversation, Krishna Kant Maharshi talks with ${guest}.`
    : "In this piece, Krishna Kant Maharshi talks through the subject in his own words."
  const leadWords = lead.split(/\s+/).filter(Boolean)
  const room = Math.max(0, 55 - leadWords.length)
  const combined = [...leadWords, ...words.slice(0, room)].slice(0, 60)
  if (combined.length < 40) {
    combined.push(..."The conversation also offers context on the guest work influences and the ideas behind the topics discussed in this KTWK interview.".split(/\s+/).slice(0, 40 - combined.length))
  }
  return combined.join(" ")
}

export function defaultSeries(series?: string) {
  const value = series?.trim()
  return value || SERIES_NAME
}
