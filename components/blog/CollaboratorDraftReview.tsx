"use client"

import { useMemo, useState, useTransition } from "react"
import { extractTextFromTiptap } from "@/lib/blog/utils"

type Draft = { title: string; excerpt: string; content: string; readTime: string; updatedAt: number }
type Published = { title: string; excerpt: string; content: string }

function articleText(content: string) {
  try {
    return extractTextFromTiptap(JSON.parse(content))
  } catch {
    return content
  }
}

function DiffField({ label, before, after }: { label: string; before: string; after: string }) {
  if (before === after) return null
  return (
    <section className="border border-black">
      <h3 className="blog-font-mono border-b border-black px-3 py-2 text-[10px] tracking-wider">{label}</h3>
      <div className="grid divide-y divide-black sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="bg-red-50 p-3"><p className="blog-font-mono mb-2 text-[9px] tracking-wider text-red-800">− CURRENT</p><pre className="whitespace-pre-wrap font-sans text-sm leading-6">{before || "(empty)"}</pre></div>
        <div className="bg-green-50 p-3"><p className="blog-font-mono mb-2 text-[9px] tracking-wider text-green-800">+ CONTRIBUTOR DRAFT</p><pre className="whitespace-pre-wrap font-sans text-sm leading-6">{after || "(empty)"}</pre></div>
      </div>
    </section>
  )
}

export function CollaboratorDraftReview({
  draft,
  post,
  onApply,
  onDiscard,
}: {
  draft: Draft
  post: Published
  onApply: () => Promise<void>
  onDiscard: () => Promise<void>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()
  const content = useMemo(() => ({ before: articleText(post.content), after: articleText(draft.content) }), [draft.content, post.content])

  function run(action: () => Promise<void>, successMessage: string) {
    startTransition(async () => {
      try {
        await action()
        setMessage(successMessage)
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not update the collaborator draft.")
      }
    })
  }

  return (
    <section className="mb-8 border-2 border-black bg-[var(--surface)] p-4" aria-labelledby="contributor-draft-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="blog-font-mono text-[10px] tracking-wider">PENDING CONTRIBUTOR DRAFT</p>
          <h2 id="contributor-draft-title" className="blog-font-headline mt-1 text-xl">Changes waiting for review</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Saved {new Date(draft.updatedAt).toLocaleString()}. These changes are not public until you apply them.</p>
        </div>
        <button type="button" onClick={() => setIsOpen((open) => !open)} className="border border-black px-3 py-2 text-sm">
          {isOpen ? "HIDE DIFF" : "REVIEW DIFF"}
        </button>
      </div>
      {isOpen ? <div className="mt-4 space-y-3">
        <DiffField label="TITLE" before={post.title} after={draft.title} />
        <DiffField label="SUMMARY" before={post.excerpt} after={draft.excerpt} />
        <DiffField label="ARTICLE CONTENT" before={content.before} after={content.after} />
      </div> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" disabled={isPending} onClick={() => run(onApply, "Draft applied. Refreshing the editor…")} className="border border-black bg-black px-4 py-2 text-sm text-white disabled:opacity-50">APPLY DRAFT</button>
        <button type="button" disabled={isPending} onClick={() => run(onDiscard, "Draft discarded. Refreshing the editor…")} className="border border-black px-4 py-2 text-sm disabled:opacity-50">DISCARD DRAFT</button>
      </div>
      {message ? <p className="mt-3 text-sm" role="status">{message}</p> : null}
    </section>
  )
}
