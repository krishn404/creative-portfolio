import assert from "node:assert/strict"
import test from "node:test"
import { extractSitemapUrls, inspectHtml } from "../scripts/validate-seo.mjs"

test("SEO validator extracts sitemap URLs", () => {
  assert.deepEqual(extractSitemapUrls("<urlset><url><loc>https://example.com/blog/a</loc></url></urlset>"), ["https://example.com/blog/a"])
})

test("SEO validator reads canonical metadata and valid BlogPosting JSON-LD", () => {
  const result = inspectHtml(`<!doctype html><html><head><title>Artist interview | KTWK</title><meta name="description" content="A specific interview."><link rel="canonical" href="https://example.com/blog/artist"><script type="application/ld+json">{"@context":"https://schema.org","@type":"BlogPosting","headline":"Artist interview"}</script></head><body><article><h1>Artist interview</h1><img src="cover.jpg" alt="Artist in the studio"><p>Conversation text.</p></article></body></html>`)
  assert.equal(result.canonical, "https://example.com/blog/artist")
  assert.deepEqual(result.h1, ["Artist interview"])
  assert.equal(result.blogPostings.length, 1)
  assert.equal(result.missingImageAlt, 0)
})
