"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { NovelEditor } from "./NovelEditor"
import { CoverImageUpload } from "./CoverImageUpload"
import { computeReadTime, parseTagsInput, slugify, type BlogPost, type PostWriteInput, type BlogFaq } from "@/lib/blog/utils"
import { seoWarnings, displayDescription, documentTitle } from "@/lib/blog/seo"

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
  const [guestName, setGuestName] = useState(post?.guestName ?? "")
  const [ogImageAlt, setOgImageAlt] = useState(post?.ogImageAlt ?? "")
  const [tldr, setTldr] = useState(post?.tldr ?? "")
  const [faq, setFaq] = useState<BlogFaq[]>(post?.faq ?? [])
  const [showSeoWarnings, setShowSeoWarnings] = useState(false)
  const [published, setPublished] = useState(post?.published ?? false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const tags = parseTagsInput(tagsInput)
  const keywords = parseTagsInput(keywordsInput)
  const effectiveSlug = slugTouched ? slug : slugify(title)
  const warnings = seoWarnings({ title, seoTitle, metaDescription, excerpt, tldr, guestName, keywords, ogImageAlt, hasCover: Boolean(coverImage) })

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
      setError("Content is required")
      return
    }

    const readTime = computeReadTime(content)
    const shouldPublish = publish ? true : published
    if (publish && warnings.length > 0 && !showSeoWarnings) {
      setShowSeoWarnings(true)
      setError("Review the SEO notes above, then choose PUBLISH again to continue.")
      return
    }

    startTransition(async () => {
      try {
        await onSave({
          title: title.trim(),
          slug: effectiveSlug.trim(),
          excerpt: excerpt.trim() || title.trim(),
          content,
          coverImage: coverImage || undefined,
          tags,
          published: shouldPublish,
          readTime,
          seoTitle: seoTitle.trim() || undefined,
          metaDescription: metaDescription.trim() || undefined,
          keywords,
          guestName: guestName.trim() || undefined,
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
          <h2 id="seo-panel-title" className="blog-font-headline text-2xl">SEO and answer details</h2>
          <label className="block text-sm">SEO title <span className="text-xs text-[var(--text-secondary)]">{documentTitle({ title, seoTitle } as BlogPost).length}/60</span>
            <input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} maxLength={120} className="mt-1 w-full border border-black bg-[var(--surface)] px-3 py-2" placeholder="Uses post title when empty" />
          </label>
          <label className="block text-sm">Meta description <span className="text-xs text-[var(--text-secondary)]">{metaDescription.length}/160</span>
            <textarea value={metaDescription} onChange={(event) => setMetaDescription(event.target.value)} rows={3} className="mt-1 w-full border border-black bg-[var(--surface)] px-3 py-2" />
          </label>
          <label className="block text-sm">Excerpt
            <textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} rows={2} className="mt-1 w-full border border-black bg-[var(--surface)] px-3 py-2" />
          </label>
          <label className="block text-sm">Keywords, comma-separated
            <input value={keywordsInput} onChange={(event) => setKeywordsInput(event.target.value)} className="mt-1 w-full border border-black bg-[var(--surface)] px-3 py-2" />
          </label>
          <label className="block text-sm">Guest name
            <input value={guestName} onChange={(event) => setGuestName(event.target.value)} className="mt-1 w-full border border-black bg-[var(--surface)] px-3 py-2" />
          </label>
          <label className="block text-sm">Cover image alt text
            <input value={ogImageAlt} onChange={(event) => setOgImageAlt(event.target.value)} className="mt-1 w-full border border-black bg-[var(--surface)] px-3 py-2" />
          </label>
          <label className="block text-sm">TL;DR, 40 to 60 words
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
            <p className="text-lg text-blue-800">{documentTitle({ title, seoTitle } as BlogPost)}</p>
            <p className="text-xs text-green-800">art.krixnx.xyz / blog / {slug || "post-slug"}</p>
            <p className="text-sm">{displayDescription({ title, excerpt: metaDescription || excerpt, metaDescription } as BlogPost)}</p>
          </div>
          {showSeoWarnings && warnings.length > 0 && <ul className="list-disc pl-5 text-sm text-amber-800" role="status">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
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
              {tags.map((tag) => (
                <span key={tag} className="blog-font-mono border border-black px-2 py-0.5 text-[9px]">
                  [{tag}]
                </span>
              ))}
            </div>
          )}
        </div>

        <CoverImageUpload value={coverImage || undefined} onChange={(url) => setCoverImage(url ?? "")} />

        <div>
          <label className="blog-font-mono mb-1 block text-[10px] tracking-wider text-[var(--text-secondary)]">
            CONTENT
          </label>
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
