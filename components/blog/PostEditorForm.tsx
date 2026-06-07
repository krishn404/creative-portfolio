"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { NovelEditor } from "./NovelEditor"
import { computeReadTime, parseTagsInput, slugify } from "@/lib/blog/utils"
import type { BlogPost } from "@/lib/blog/utils"

type PostEditorFormProps = {
  post?: BlogPost
  onSave: (data: {
    title: string
    slug: string
    excerpt: string
    content: string
    coverImage?: string
    tags: string[]
    published: boolean
    readTime: string
  }) => Promise<void>
}

export function PostEditorForm({ post, onSave }: PostEditorFormProps) {
  const [title, setTitle] = useState(post?.title ?? "")
  const [slug, setSlug] = useState(post?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug))
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "")
  const [tagsInput, setTagsInput] = useState(post?.tags.join(", ") ?? "")
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "")
  const [content, setContent] = useState(post?.content ?? "")
  const [published, setPublished] = useState(post?.published ?? false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!slugTouched && title) {
      setSlug(slugify(title))
    }
  }, [title, slugTouched])

  const tags = parseTagsInput(tagsInput)

  async function handleSave(publish: boolean) {
    setError(null)
    if (!title.trim()) {
      setError("Title is required")
      return
    }
    if (!slug.trim()) {
      setError("Slug is required")
      return
    }
    if (!content.trim()) {
      setError("Content is required")
      return
    }

    const readTime = computeReadTime(content)
    const shouldPublish = publish ? true : published

    startTransition(async () => {
      try {
        await onSave({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim() || title.trim(),
          content,
          coverImage: coverImage.trim() || undefined,
          tags,
          published: shouldPublish,
          readTime,
        })
        if (publish) setPublished(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save post")
      }
    })
  }

  return (
    <div className="relative z-10 pb-24">
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
          <label className="blog-font-mono mb-1 block text-[10px] tracking-wider text-[var(--text-secondary)]">
            SLUG
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
            className="blog-font-mono w-full border border-black bg-[var(--surface)] px-3 py-2 text-sm outline-none"
          />
        </div>

        <div>
          <label className="blog-font-mono mb-1 block text-[10px] tracking-wider text-[var(--text-secondary)]">
            EXCERPT
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="blog-font-body w-full resize-none border border-black bg-[var(--surface)] px-3 py-2 text-base outline-none"
          />
        </div>

        <div>
          <label className="blog-font-mono mb-1 block text-[10px] tracking-wider text-[var(--text-secondary)]">
            TAGS (COMMA-SEPARATED)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="design, dev, music"
            className="blog-font-mono w-full border border-black bg-[var(--surface)] px-3 py-2 text-sm outline-none"
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

        <div>
          <label className="blog-font-mono mb-1 block text-[10px] tracking-wider text-[var(--text-secondary)]">
            COVER IMAGE URL
          </label>
          <input
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://..."
            className="blog-font-mono w-full border border-black bg-[var(--surface)] px-3 py-2 text-sm outline-none"
          />
        </div>

        <div>
          <label className="blog-font-mono mb-1 block text-[10px] tracking-wider text-[var(--text-secondary)]">
            CONTENT
          </label>
          <NovelEditor content={content} onChange={setContent} />
        </div>

        {error && (
          <p className="blog-font-mono text-xs text-red-600">// {error}</p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-black bg-[var(--surface)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="blog-font-mono text-xs tracking-wider">
            {published ? (
              <>
                <span className="text-[var(--accent-neon)]">◆</span> LIVE
              </>
            ) : (
              "// DRAFT"
            )}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSave(false)}
              className="blog-font-headline border border-black bg-[var(--surface)] px-4 py-2 text-sm font-medium hover:bg-black hover:text-white disabled:opacity-50"
            >
              SAVE DRAFT
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSave(true)}
              className="blog-font-headline border border-black bg-black px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-neon)] hover:text-black disabled:opacity-50"
            >
              {isPending ? "SAVING..." : "PUBLISH"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
