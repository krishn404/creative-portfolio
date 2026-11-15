"use client"

import { useState, useTransition } from "react"
import { CollaboratorPostEditor } from "./CollaboratorPostEditor"

type CollaboratorPost = { title: string; excerpt: string; content: string; slug: string }
type AccessResult = { ok: true; post: CollaboratorPost } | { ok: false; message: string }

export function CollaboratorEditGate({
  slug,
  code,
  onAuthenticate,
  onSave,
}: {
  slug: string
  code: string
  onAuthenticate: (input: { slug: string; code: string; password: string }) => Promise<AccessResult>
  onSave: (input: { slug: string; code: string; password: string; title: string; excerpt: string; content: string }) => Promise<{ ok: boolean; message?: string }>
}) {
  const [password, setPassword] = useState("")
  const [post, setPost] = useState<CollaboratorPost | null>(null)
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  function unlock() {
    setMessage("")
    startTransition(async () => {
      const result = await onAuthenticate({ slug, code, password })
      if (result.ok) setPost(result.post)
      else setMessage(result.message)
    })
  }

  if (post) return <CollaboratorPostEditor post={post} code={code} password={password} onSave={onSave} />

  return (
    <main className="blog-shell grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md border border-black bg-[var(--surface)] p-6">
        <p className="blog-font-mono text-xs tracking-wider text-[var(--text-secondary)]">CONTRIBUTOR ACCESS</p>
        <h1 className="blog-font-headline mt-2 text-3xl">Enter the password</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Use the separate password shared with this four-character link.</p>
        <label className="mt-5 block text-sm">Password
          <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") unlock() }} className="mt-1 w-full border border-black bg-white px-3 py-2" />
        </label>
        <button type="button" disabled={isPending || !password} onClick={unlock} className="mt-4 w-full border border-black bg-black px-4 py-2 text-sm text-white disabled:opacity-50">{isPending ? "CHECKING…" : "OPEN DRAFT"}</button>
        {message ? <p className="mt-3 text-sm text-red-700" role="alert">{message}</p> : null}
      </section>
    </main>
  )
}
