"use client"

import { useState, useTransition } from "react"
import { NovelEditor } from "./NovelEditor"

type CollaboratorPost = {
  title: string
  excerpt: string
  content: string
  slug: string
}

export function CollaboratorPostEditor({
  post,
  token,
  onSave,
}: {
  post: CollaboratorPost
  token: string
  onSave: (input: { slug: string; token: string; title: string; excerpt: string; content: string }) => Promise<{ ok: boolean; message?: string }>
}) {
  const [title, setTitle] = useState(post.title)
  const [excerpt, setExcerpt] = useState(post.excerpt)
  const [content, setContent] = useState(post.content)
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  function save() {
    setMessage("")
    startTransition(async () => {
      const result = await onSave({ slug: post.slug, token, title, excerpt, content })
      setMessage(result.ok ? "Your draft has been saved for the editor to review." : result.message ?? "Could not save your draft.")
    })
  }

  return (
    <main className="blog-shell min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 border-b border-black pb-5">
          <p className="blog-font-mono text-xs tracking-wider text-[var(--text-secondary)]">CONTRIBUTOR EDITOR</p>
          <h1 className="blog-font-headline mt-2 text-3xl font-semibold">Review your article</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">You can edit the title, summary, and article text. Publishing, URLs, tags, and search settings remain with the editor.</p>
        </header>

        <div className="space-y-6 pb-28">
          <label className="block text-sm">Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full border border-black bg-[var(--surface)] px-3 py-2 text-lg" />
          </label>
          <label className="block text-sm">Summary
            <textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} rows={3} className="mt-1 w-full border border-black bg-[var(--surface)] px-3 py-2" />
          </label>
          <div>
            <label className="block text-sm">Article content</label>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Your changes are saved as a private draft for the editor to review.</p>
            <div className="mt-2 border border-black"><NovelEditor content={content} onChange={setContent} /></div>
          </div>
        </div>

        <footer className="fixed inset-x-0 bottom-0 border-t border-black bg-[var(--surface)] p-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <p className="text-sm" role="status">{message}</p>
            <button type="button" disabled={isPending || !title.trim() || !content.trim()} onClick={save} className="border border-black bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
              {isPending ? "SAVING…" : "SAVE DRAFT"}
            </button>
          </div>
        </footer>
      </div>
    </main>
  )
}
