import { pathToFileURL } from "node:url"

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

const first = (html, pattern) => html.match(pattern)?.[1] ?? ""
const all = (html, pattern) => [...html.matchAll(pattern)].map((match) => match[1])

export function extractSitemapUrls(xml) {
  return all(xml, /<loc>([\s\S]*?)<\/loc>/gi).map(cleanText)
}

function collectTypes(value, result = []) {
  if (Array.isArray(value)) value.forEach((item) => collectTypes(item, result))
  else if (value && typeof value === "object") {
    if (value["@type"]) result.push(value["@type"])
    Object.values(value).forEach((item) => collectTypes(item, result))
  }
  return result
}

function findTyped(value, type, result = []) {
  if (Array.isArray(value)) value.forEach((item) => findTyped(item, type, result))
  else if (value && typeof value === "object") {
    const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]]
    if (types.includes(type)) result.push(value)
    Object.values(value).forEach((item) => findTyped(item, type, result))
  }
  return result
}

export function inspectHtml(html) {
  const jsonLd = []
  const jsonLdErrors = []
  for (const source of all(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      jsonLd.push(JSON.parse(source))
    } catch (error) {
      jsonLdErrors.push(error instanceof Error ? error.message : String(error))
    }
  }

  const article = first(html, /<article\b[^>]*>([\s\S]*?)<\/article>/i)
  const images = all(article, /<img\b([^>]*)>/gi).map((attributes) => ({
    alt: attributes.match(/\balt=["']([^"']*)["']/i)?.[1] ?? null,
  }))

  return {
    title: cleanText(first(html, /<title[^>]*>([\s\S]*?)<\/title>/i)),
    description: first(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i),
    canonical: first(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)/i),
    robots: first(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)/i),
    h1: all(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi).map(cleanText),
    hrefs: all(html, /<a\b[^>]+href=["']([^"']+)["']/gi),
    jsonLd,
    jsonLdErrors,
    jsonLdTypes: [...new Set(jsonLd.flatMap((value) => collectTypes(value)))],
    blogPostings: jsonLd.flatMap((value) => findTyped(value, "BlogPosting")),
    imageCount: images.length,
    missingImageAlt: images.filter((image) => image.alt === null || image.alt.trim() === "").length,
    articleWordCount: cleanText(article).split(/\s+/).filter(Boolean).length,
  }
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: "follow" })
  return { response, text: await response.text() }
}

async function mapLimit(values, limit, task) {
  const results = new Array(values.length)
  let cursor = 0
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor++
      results[index] = await task(values[index], index)
    }
  }))
  return results
}

export async function validateSite(baseUrl, canonicalUrl = baseUrl) {
  const base = baseUrl.replace(/\/$/, "")
  const canonicalBase = canonicalUrl.replace(/\/$/, "")
  const errors = []
  const warnings = []
  const pages = []
  const fail = (message) => errors.push(message)
  const warn = (message) => warnings.push(message)

  const [{ response: robotsResponse, text: robots }, { response: sitemapResponse, text: sitemap }, { response: blogResponse, text: blogHtml }] =
    await Promise.all([fetchText(`${base}/robots.txt`), fetchText(`${base}/sitemap.xml`), fetchText(`${base}/blog`)])

  if (!robotsResponse.ok) fail(`robots.txt returned ${robotsResponse.status}`)
  if (!sitemapResponse.ok) fail(`sitemap.xml returned ${sitemapResponse.status}`)
  if (!blogResponse.ok) fail(`Blog index returned ${blogResponse.status}`)
  if (/Disallow:\s*\/blog(?:\s|$)/i.test(robots)) fail("robots.txt blocks /blog")
  if (!robots.includes(`Sitemap: ${canonicalBase}/sitemap.xml`)) fail("robots.txt does not reference the canonical sitemap")

  const sitemapUrls = extractSitemapUrls(sitemap)
  const duplicateSitemapUrls = sitemapUrls.filter((url, index) => sitemapUrls.indexOf(url) !== index)
  if (duplicateSitemapUrls.length) fail(`Duplicate sitemap URLs: ${[...new Set(duplicateSitemapUrls)].join(", ")}`)
  if (sitemapUrls.some((url) => !url.startsWith(`${canonicalBase}/`) && url !== canonicalBase)) fail("Sitemap contains a URL outside the canonical origin")

  const blog = inspectHtml(blogHtml)
  const linkedArticles = [...new Set(blog.hrefs
    .map((href) => new URL(new URL(href, base).pathname, canonicalBase).toString())
    .filter((url) => /^https?:\/\/[^/]+\/blog\/[^/?#]+$/.test(url)))]
  const sitemapArticles = sitemapUrls.filter((url) => /^https?:\/\/[^/]+\/blog\/[^/?#]+$/.test(url))
  for (const url of linkedArticles) if (!sitemapArticles.includes(url)) fail(`Blog-linked article missing from sitemap: ${url}`)

  await mapLimit(sitemapUrls, 8, async (url) => {
    try {
      const publicUrl = new URL(url)
      const requestUrl = base === canonicalBase ? url : `${base}${publicUrl.pathname}${publicUrl.search}`
      const { response, text } = await fetchText(requestUrl)
      const html = inspectHtml(text)
      pages.push({ url, status: response.status, ...html })
      if (!response.ok) fail(`Sitemap URL returned ${response.status}: ${url}`)
      if (/\/blog\/[^/]+$/.test(new URL(url).pathname)) {
        if (html.canonical !== url) fail(`Wrong article canonical: ${url} -> ${html.canonical || "missing"}`)
        if (!html.title) fail(`Missing article title: ${url}`)
        if (!html.description) fail(`Missing article description: ${url}`)
        if (/noindex/i.test(html.robots)) fail(`Article is noindex: ${url}`)
        if (html.h1.length !== 1) fail(`Article must have exactly one H1 (${html.h1.length}): ${url}`)
        if (html.jsonLdErrors.length) fail(`Invalid JSON-LD: ${url}`)
        const posting = html.blogPostings[0]
        if (!posting) fail(`Missing BlogPosting JSON-LD: ${url}`)
        else for (const field of ["headline", "description", "author", "publisher", "datePublished", "dateModified", "image", "mainEntityOfPage"]) {
          if (!posting[field]) fail(`BlogPosting.${field} is missing: ${url}`)
        }
        if (html.articleWordCount < 250) warn(`Thin article body (${html.articleWordCount} words): ${url}`)
        if (html.missingImageAlt) warn(`${html.missingImageAlt} article image(s) lack alt text: ${url}`)
      }
    } catch (error) {
      fail(`Failed to fetch ${url}: ${error instanceof Error ? error.message : String(error)}`)
    }
  })

  const articlePages = pages.filter((page) => /^https?:\/\/[^/]+\/blog\/[^/?#]+$/.test(page.url))
  for (const field of ["title", "description"]) {
    const values = articlePages.map((page) => page[field]).filter(Boolean)
    const duplicates = values.filter((value, index) => values.indexOf(value) !== index)
    if (duplicates.length) fail(`Duplicate article ${field}s: ${[...new Set(duplicates)].join(" | ")}`)
  }

  return { base, canonicalBase, checkedAt: new Date().toISOString(), sitemapUrlCount: sitemapUrls.length, articleCount: sitemapArticles.length, errors, warnings }
}

async function main() {
  const base = process.env.SEO_BASE_URL || process.argv.find((value) => /^https?:\/\//.test(value)) || "https://art.krixnx.xyz"
  const canonicalBase = process.env.SEO_CANONICAL_URL || (/(?:localhost|127\.0\.0\.1)/.test(base) ? "https://art.krixnx.xyz" : base)
  const report = await validateSite(base, canonicalBase)
  console.log(JSON.stringify(report, null, 2))
  if (report.errors.length) process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
