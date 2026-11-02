export function saveErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error ?? "")
  if (message.includes("UNAUTHORIZED")) {
    return "Your admin session expired. Refresh the page and sign in again."
  }
  if (message.toLowerCase().includes("slug already exists")) {
    return "That SLUG is already in use. Choose a different slug and try again."
  }

  // Keep production failures actionable for the authenticated admin while
  // avoiding stack traces, URLs, or credential-like values in the UI.
  const detail = message
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !/^at\s/.test(line) && !/^server error:?$/i.test(line))
    ?.replace(/https?:\/\/\S+/gi, "[service]")
    .replace(/(token|secret|password)\s*[:=]\s*\S+/gi, "$1=[redacted]")
    .slice(0, 220)

  return detail
    ? `Save failed: ${detail}`
    : "Save failed without a server error message. Check the Convex deployment and Vercel function logs."
}
