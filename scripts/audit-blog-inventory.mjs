import { extractSitemapUrls, inspectHtml } from "./validate-seo.mjs"

const cleanText = (value = "") =>
  value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const all = (html, pattern) => [...html.matchAll(pattern)].map((match) => cleanText(match[1]))

function findTyped(value, type, result = []) {
  if (Array.isArray(value)) value.forEach((item) => findTyped(item, type, result))
  else if (value && typeof value === "object") {
    const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]]
    if (types.includes(type)) result.push(value)
    Object.values(value).forEach((item) => findTyped(item, type, result))
  }
  return result
}

async function main() {
  const base = (process.argv.find((value) => /^https?:\/\//.test(value)) || "https://art.krixnx.xyz").replace(/\/$/, "")
  const sitemapResponse = await fetch(`${base}/sitemap.xml`)
  if (!sitemapResponse.ok) throw new Error(`Sitemap returned ${sitemapResponse.status}`)

  const sitemapUrls = extractSitemapUrls(await sitemapResponse.text())
  const articleUrls = sitemapUrls.filter((url) => /^https?:\/\/[^/]+\/blog\/[^/?#]+$/.test(url))
  const articles = []

  for (const canonicalUrl of articleUrls) {
    const canonical = new URL(canonicalUrl)
    const requestUrl = `${base}${canonical.pathname}`
    const response = await fetch(requestUrl, { redirect: "follow" })
    const html = await response.text()
    const inspected = inspectHtml(html)
    const posting = inspected.jsonLd.flatMap((value) => findTyped(value, "BlogPosting"))[0] ?? {}
    const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ?? ""
    const images = [...article.matchAll(/<img\b([^>]*)>/gi)].map((match) => ({
      src: match[1].match(/\bsrc=["']([^"']*)["']/i)?.[1] ?? "",
      alt: match[1].match(/\balt=["']([^"']*)["']/i)?.[1] ?? "",
    }))

    articles.push({
      url: canonicalUrl,
      status: response.status,
      title: inspected.title,
      description: inspected.description,
      canonical: inspected.canonical,
      robots: inspected.robots || "index (default)",
      h1: inspected.h1,
      h2: all(article, /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi),
      published: posting.datePublished,
      modified: posting.dateModified,
      author: posting.author?.name,
      subjects: Array.isArray(posting.mentions)
        ? posting.mentions.map((item) => item?.name).filter(Boolean)
        : [],
      internalArticleLinks: inspected.hrefs.filter((href) => /^\/blog\/[^/?#]+$/.test(href)),
      wordCount: inspected.articleWordCount,
      missingImageAlt: inspected.missingImageAlt,
      images,
      bodyStart: cleanText(article).slice(0, 1200),
    })
  }

  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), base, articleCount: articles.length, articles }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
