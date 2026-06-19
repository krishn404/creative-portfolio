export type RichTextToken =
  | { type: "text"; value: string }
  | { type: "spotify"; label: string; href: string }
  | { type: "instagram"; label: string; href: string }
  | { type: "link"; label: string; href: string }
  | { type: "tool"; label: string; tool: "photoshop" | "canva" }

const INLINE_LINK_PATTERN =
  /\[\[(spotify|instagram|link|tool)\|([^|\]]+?)\|([^\]]+?)\]\]/gi

const TOOL_IDS = new Set(["photoshop", "canva"])

export const RICH_TEXT_SYNTAX_HELP = [
  "[[spotify|Listen On Spotify|https://open.spotify.com/...]]",
  "[[instagram|View Post|https://instagram.com/p/...]]",
  "[[link|Custom text|https://example.com]]",
  "[[tool|Photoshop|photoshop]]",
  "[[tool|Canva|canva]]",
] as const

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:"
  } catch {
    return false
  }
}

export function parseRichText(input: string): RichTextToken[] {
  if (!input) return []

  const tokens: RichTextToken[] = []
  let lastIndex = 0

  for (const match of input.matchAll(INLINE_LINK_PATTERN)) {
    const index = match.index ?? 0
    if (index > lastIndex) {
      tokens.push({ type: "text", value: input.slice(lastIndex, index) })
    }

    const kind = match[1].toLowerCase()
    const label = match[2].trim()
    const value = match[3].trim()

    if (kind === "tool" && TOOL_IDS.has(value.toLowerCase())) {
      tokens.push({
        type: "tool",
        label,
        tool: value.toLowerCase() as "photoshop" | "canva",
      })
    } else if (kind === "spotify" && isValidUrl(value)) {
      tokens.push({ type: "spotify", label, href: value })
    } else if (kind === "instagram" && isValidUrl(value)) {
      tokens.push({ type: "instagram", label, href: value })
    } else if (kind === "link" && isValidUrl(value)) {
      tokens.push({ type: "link", label, href: value })
    } else {
      tokens.push({ type: "text", value: match[0] })
    }

    lastIndex = index + match[0].length
  }

  if (lastIndex < input.length) {
    tokens.push({ type: "text", value: input.slice(lastIndex) })
  }

  return tokens
}
