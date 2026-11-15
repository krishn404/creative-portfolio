"use client"

import { useState, useTransition } from "react"

type CollaboratorAccessProps = {
  postId: string
  enabled: boolean
  onChange: (enabled: boolean) => Promise<{ enabled: boolean; path?: string }>
}

export function CollaboratorAccess({ postId, enabled, onChange }: CollaboratorAccessProps) {
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [link, setLink] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  function updateAccess(nextEnabled: boolean) {
    startTransition(async () => {
      try {
        const result = await onChange(nextEnabled)
        setIsEnabled(result.enabled)
        setLink(result.path ? `${window.location.origin}${result.path}` : null)
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
    if (!link) return
    await navigator.clipboard.writeText(link)
    setMessage("Collaborator link copied.")
  }

  return (
    <section className="mb-8 border border-black bg-[var(--surface)] p-4" aria-labelledby={`collaborator-access-${postId}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id={`collaborator-access-${postId}`} className="blog-font-headline text-xl">Contributor access</h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
            Give an artist a private link to revise this post&apos;s title, excerpt, and article body. They cannot publish, change the URL, or edit SEO settings.
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
      {link ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input aria-label="Collaborator link" readOnly value={link} className="min-w-0 flex-1 border border-black bg-white px-3 py-2 font-mono text-xs" />
          <button type="button" onClick={copyLink} className="border border-black bg-black px-3 py-2 text-sm text-white">COPY LINK</button>
        </div>
      ) : null}
      {message ? <p className="mt-3 text-sm" role="status">{message}</p> : null}
    </section>
  )
}
