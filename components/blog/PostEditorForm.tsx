"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { NovelEditor } from "./NovelEditor"
import { CoverImageUpload } from "./CoverImageUpload"
import { computeReadTime, parseTagsInput, slugify, type ArticleType, type BlogPost, type PostWriteInput, type BlogFaq } from "@/lib/blog/utils"
import { articleTypeOf, defaultSeoTitle, seoWarnings, displayDescription, documentTitle } from "@/lib/blog/seo"

type PostEditorFormProps = {
  post?: BlogPost
  onSave: (data: PostWriteInput) => Promise<void>
}

export function PostEditorForm({ post, onSave }: PostEditorFormProps) {
  const [title, setTitle] = useState(post?.title ?? "")
  const [slug, setSlug] = useState(post?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug))
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "")
  const [tagsInput, setTagsInput] = useState(post?.tags.join(", ") ?? "")
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "")
  const [content, setContent] = useState(post?.content ?? "")
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "")
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? "")
  const [keywordsInput, setKeywordsInput] = useState(post?.keywords?.join(", ") ?? "")
  const [articleType, setArticleType] = useState<ArticleType>(post ? articleTypeOf(post) : "article")
  const [guestName, setGuestName] = useState(post?.guestName ?? "")
  const [subjectAliasesInput, setSubjectAliasesInput] = useState(post?.subjectAliases?.join(", ") ?? "")
  const [subjectSameAsInput, setSubjectSameAsInput] = useState(post?.subjectSameAs?.join("\n") ?? "")
  const [ogImageAlt, setOgImageAlt] = useState(post?.ogImageAlt ?? "")
  const [tldr, setTldr] = useState(post?.tldr ?? "")
  const [faq, setFaq] = useState<BlogFaq[]>(post?.faq ?? [])
  const [published, setPublished] = useState(post?.published ?? false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const tags = parseTagsInput(tagsInput)
  const keywords = parseTagsInput(keywordsInput)
  const subjectAliases = Array.from(new Map(subjectAliasesInput.split(",").map((value) => value.trim()).filter(Boolean).map((value) => [value.toLowerCase(), value])).values())
  const subjectSameAs = Array.from(new Set(subjectSameAsInput.split(/[\n,]/).map((value) => value.trim()).filter(Boolean)))
  const effectiveSlug = slugTouched ? slug : slugify(title)
  const previewPost = { title, seoTitle, metaDescription, excerpt, content, articleType, guestName, subjectAliases, subjectSameAs } as BlogPost
  const warnings = seoWarnings({ title, seoTitle, metaDescription, excerpt, tldr, guestName, articleType, subjectAliases, subjectSameAs, keywords, ogImageAlt, hasCover: Boolean(coverImage), content })

  async function handleSave(publish: boolean) {
    setError(null)
    if (!title.trim()) {
      setError("Title is required")
      return
    }
    if (!effectiveSlug.trim()) {
      setError("Slug is required")
      return
    }
    if (!content.trim()) {
      setError("CONTENT is required. Write or paste the article in the large editor under the CONTENT label.")
      return
    }

    const invalidIdentityUrl = subjectSameAs.find((value) => {
      try {
        return !["http:", "https:"].includes(new URL(value).protocol)
      } catch {
        return true
      }
    })
    if (invalidIdentityUrl) {
      setError(`Verified identity URL is invalid: ${invalidIdentityUrl}`)
      return
    }

    const readTime = computeReadTime(content)
    const shouldPublish = publish ? true : published
    startTransition(async () => {
      try {
        await onSave({
          title: title.trim(),
          slug: effectiveSlug.trim(),
          excerpt: excerpt.trim(),
          content,
          coverImage: coverImage || undefined,
          tags,
          published: shouldPublish,
          readTime,
          seoTitle: seoTitle.trim() || undefined,
          metaDescription: metaDescription.trim() || undefined,
          keywords,
          articleType,
          guestName: guestName.trim() || undefined,
          subjectAliases,
          subjectSameAs,
          ogImageAlt: ogImageAlt.trim() || undefined,
          tldr: tldr.trim() || undefined,
          faq: faq.filter((item) => item.q.trim() && item.a.trim()),
        })
        if (publish) setPublished(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save post")
      }
    })
  }

  return (
    <div className="relative z-10 pb-32">
      <div className="mb-8 flex items-center justify-between border-b border-black pb-4">
        <Link
          href="/admin/blog"
          className="blog-font-mono text-xs tracking-wider hover:underline"
        >
          ← BLOG ADMIN
        </Link>
      </div>

      <div className="space-y-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title..."
          className="blog-font-headline w-full border-0 border-b border-black bg-transparent py-3 text-3xl font-medium outline-none sm:text-4xl"
        />

        <div>
          <label htmlFor="post-slug" className="blog-font-mono mb-1 block text-[10px] tracking-wider text-[var(--text-secondary)]">
            SLUG
          </label>
          <p id="post-slug-help" className="mb-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            The clean URL path of the article used for SEO and routing, for example /blog/renaissance-review.
          </p>
          <input
            id="post-slug"
            type="text"
            value={effectiveSlug}
            aria-describedby="post-slug-help"
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
            className="blog-font-mono w-full border border-black bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        <section className="space-y-4 border border-black p-4" aria-labelledby="seo-panel-title">
          <h2 id="seo-panel-title" className="blog-font-headline text-2xl">Article identity and search appearance</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">Article type
              <select value={articleType} onChange={(event) => setArticleType(event.target.value as ArticleType)} className="mt-1 w-full border border-black bg-[var(--surface)] px-3 py-2">
                <option value="interview">Interview</option>
                <option value="review">Review</option>
                <option value="article">Article / other writing</option>
              </select>
            </label>
            <label className="block text-sm">Author / interviewer
              <input value="Krishna Kant Maharshi" readOnly className="mt-1 w-full border border-black bg-black/5 px-3 py-2 text-[var(--text-secondary)]" />
            </label>
          </div>
          <label className="block text-sm">Verified artist / guest / subject display name
            <input value={guestName} onChange={(event) => setGuestName(event.target.value)} className="mt-1 w-full border border-black bg-[var(--surface)] px-3 py-2" placeholder={articleType === "interview" ? "Required context for interviews" : "Add when the piece is about a named artist"} />
          </label>
          <label className="block text-sm">Verified aliases, comma-separated
            <input value={subjectAliasesInput} onChange={(event) => setSubjectAliasesInput(event.target.value)} className="mt-1 w-full border border-black bg-[var(--surface)] px-3 py-2" placeholder="Only names confirmed by the article or artist" />
          </label>
          <label className="block text-sm">Verified identity links, one per line
            <textarea value={subjectSameAsInput} onChange={(event) => setSubjectSameAsInput(event.target.value)} rows={2} className="mt-1 w-full border border-black bg-[var(--surface)] px-3 py-2" placeholder="Official artist site or profile URLs only" />
          </label>
          <label className="block text-sm">SEO title <span className="text-xs text-[var(--text-secondary)]">{documentTitle(previewPost).length} characters; guidance only</span>
            <input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} maxLength={180} className="mt-1 w-full border border-black bg-[var(--surface)] px-3 py-2" placeholder={defaultSeoTitle(previewPost) || "Generated from article type, subject and headline"} />
            <button type="button" onClick={() => setSeoTitle("")} className="mt-1 text-xs underline">Reset to deterministic default</button>
          </label>
          <label className="block text-sm">Meta description <span className="text-xs text-[var(--text-secondary)]">{metaDescription.length} characters; search engines may show a different snippet</span>
            <textarea value={metaDescription} onChange={(event) => setMetaDescription(event.target.value)} rows={3} className="mt-1 w-full border border-black bg-[var(--surface)] px-3 py-2" />
            <button type="button" onClick={() => setMetaDescription("")} className="mt-1 text-xs underline">Reset to excerpt-based default</button>
          </label>
          <label className="block text-sm">Excerpt
            <textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} rows={2} className="mt-1 w-full border border-black bg-[var(--surface)] px-3 py-2" />
          </label>
          <label className="block text-sm">Additional topics, comma-separated
            <input value={keywordsInput} onChange={(event) => setKeywordsInput(event.target.value)} className="mt-1 w-full border border-black bg-[var(--surface)] px-3 py-2" />
            <span className="mt-1 block text-xs text-[var(--text-secondary)]">Used for internal discovery and structured article topics, not as a meta-keywords ranking field.</span>
          </label>
          <label className="block text-sm">Cover image alt text
            <input value={ogImageAlt} onChange={(event) => setOgImageAlt(event.target.value)} className="mt-1 w-full border border-black bg-[var(--surface)] px-3 py-2" />
          </label>
          <label className="block text-sm">Visible article summary, roughly 40 to 60 words
            <textarea value={tldr} onChange={(event) => setTldr(event.target.value)} rows={3} className="mt-1 w-full border border-black bg-[var(--surface)] px-3 py-2" />
          </label>
          <div>
            <h3 className="mb-2 text-sm font-medium">Frequently asked questions</h3>
            {faq.map((item, index) => <div key={index} className="mb-3 grid gap-2 sm:grid-cols-2">
              <input aria-label={`FAQ question ${index + 1}`} value={item.q} onChange={(event) => setFaq(faq.map((entry, i) => i === index ? { ...entry, q: event.target.value } : entry))} placeholder="Question" className="border border-black bg-[var(--surface)] px-3 py-2" />
              <div className="flex gap-2"><textarea aria-label={`FAQ answer ${index + 1}`} value={item.a} onChange={(event) => setFaq(faq.map((entry, i) => i === index ? { ...entry, a: event.target.value } : entry))} placeholder="Answer" rows={2} className="min-w-0 flex-1 border border-black bg-[var(--surface)] px-3 py-2" /><button type="button" onClick={() => setFaq(faq.filter((_, i) => i !== index))} className="text-sm underline">Remove</button></div>
            </div>)}
            <button type="button" onClick={() => setFaq([...faq, { q: "", a: "" }])} className="text-sm underline">Add FAQ</button>
          </div>
          <div className="border border-black bg-white p-3 text-black" aria-label="Google search snippet preview">
            <p className="text-lg text-blue-800">{documentTitle(previewPost)}</p>
            <p className="text-xs text-green-800">art.krixnx.xyz / blog / {slug || "post-slug"}</p>
            <p className="text-sm">{displayDescription(previewPost)}</p>
          </div>
          {warnings.length > 0 && <div className="border border-amber-700 bg-amber-50 p-3 text-amber-900"><p className="text-sm font-medium">Review before publishing (advisory)</p><ul className="mt-2 list-disc pl-5 text-sm" role="status">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}
        </section>

        <div>
          <label htmlFor="post-tags" className="blog-font-mono mb-1 block text-[10px] tracking-wider text-[var(--text-secondary)]">
            TAGS (COMMA-SEPARATED)
          </label>
          <input
            id="post-tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="design, dev, music"
            className="blog-font-mono w-full border border-black bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
          />
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span key={`${tag}-${index}`} className="blog-font-mono border border-black px-2 py-0.5 text-[9px]">
                  [{tag}]
                </span>
              ))}
            </div>
          )}
        </div>

        <CoverImageUpload value={coverImage || undefined} onChange={(url) => setCoverImage(url ?? "")} />

        <div>
          <label className="blog-font-mono mb-1 block text-[10px] tracking-wider text-[var(--text-secondary)]">
            CONTENT (REQUIRED)
          </label>
          <p className="mb-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            Write or paste the article body in the editor below.
          </p>
          <NovelEditor content={content} onChange={setContent} />
        </div>

        {error && (
          <p className="blog-font-mono text-xs text-red-600" role="alert">
            {`// ${error}`}
          </p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-black bg-[var(--surface)] pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="blog-font-mono text-xs tracking-wider">
            {published ? (
              <>
                <span className="text-[var(--accent-neon)]">◆</span> LIVE
              </>
            ) : (
              "// DRAFT"
            )}
          </span>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSave(false)}
              className="blog-font-headline min-h-10 flex-1 border border-black bg-[var(--surface)] px-4 py-2 text-sm font-medium hover:bg-black hover:text-white disabled:opacity-50 sm:flex-none"
            >
              SAVE DRAFT
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSave(true)}
              className="blog-font-headline min-h-10 flex-1 border border-black bg-black px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-neon)] hover:text-black disabled:opacity-50 sm:flex-none"
            >
              {isPending ? "SAVING..." : "PUBLISH"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
