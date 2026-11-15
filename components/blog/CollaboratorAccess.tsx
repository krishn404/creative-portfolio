"use client"

import { useState, useTransition } from "react"

type CollaboratorAccessProps = {
  postId: string
  enabled: boolean
  onChange: (enabled: boolean) => Promise<{ ok: true; enabled: boolean; path?: string; password?: string } | { ok: false; message: string }>
}

export function CollaboratorAccess({ postId, enabled, onChange }: CollaboratorAccessProps) {
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [link, setLink] = useState<string | null>(null)
  const [password, setPassword] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  function updateAccess(nextEnabled: boolean) {
    startTransition(async () => {
      try {
        const result = await onChange(nextEnabled)
        if (!result.ok) throw new Error(result.message)
        setIsEnabled(result.enabled)
        setLink(result.path ? `${window.location.origin}${result.path}` : null)
        setPassword(result.password ?? null)
        setMessage(
          result.enabled
            ? "A new collaborator link has been generated. Copy it now; it cannot be shown again after you leave this page."
            : "Collaborator access has been disabled and the previous link no longer works.",
        )
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not update collaborator access.")
      }
    })
  }

  async function copyLink() {
    if (!link || !password) return
    await navigator.clipboard.writeText(`Collaborator link: ${link}\nPassword: ${password}`)
    setMessage("Collaborator link and password copied.")
  }

  return (
    <section className="mb-8 border border-black bg-[var(--surface)] p-4" aria-labelledby={`collaborator-access-${postId}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id={`collaborator-access-${postId}`} className="blog-font-headline text-xl">Contributor access</h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
            Give an artist a short private link and separate password to revise this post&apos;s title, excerpt, and article body. They cannot publish, change the URL, or edit SEO settings.
          </p>
        </div>
        <div className="flex gap-2">
          {isEnabled ? (
            <button type="button" disabled={isPending} onClick={() => updateAccess(true)} className="border border-black px-3 py-2 text-sm disabled:opacity-50">
              {isPending ? "UPDATING…" : "REPLACE LINK"}
            </button>
          ) : null}
          <button
            type="button"
            disabled={isPending}
            onClick={() => updateAccess(!isEnabled)}
            className="border border-black px-3 py-2 text-sm disabled:opacity-50"
          >
            {isPending ? "UPDATING…" : isEnabled ? "DISABLE ACCESS" : "ENABLE & CREATE LINK"}
          </button>
        </div>
      </div>
      {isEnabled && !link ? <p className="mt-3 text-sm text-[var(--text-secondary)]">Access is active. Use “Replace link” to generate a new shareable link; the old link will stop working.</p> : null}
      {link && password ? (
        <div className="mt-3 space-y-2">
          <label className="block text-xs">Short collaborator link<input aria-label="Collaborator link" readOnly value={link} className="mt-1 w-full border border-black bg-white px-3 py-2 font-mono text-xs" /></label>
          <label className="block text-xs">Separate password<input aria-label="Collaborator password" readOnly value={password} className="mt-1 w-full border border-black bg-white px-3 py-2 font-mono text-xs" /></label>
          <button type="button" onClick={copyLink} className="border border-black bg-black px-3 py-2 text-sm text-white">COPY LINK + PASSWORD</button>
        </div>
      ) : null}
      {message ? <p className="mt-3 text-sm" role="status">{message}</p> : null}
    </section>
  )
}
