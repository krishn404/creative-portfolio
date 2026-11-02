export function parseTagsInput(input) {
  return uniqueTags(input.split(",")).map((tag) => tag.toLowerCase())
}

export function uniqueTags(tags = []) {
  const seen = new Set()
  return tags.map((tag) => tag.trim()).filter((tag) => {
    const normalized = tag.toLowerCase()
    if (!normalized || seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}
