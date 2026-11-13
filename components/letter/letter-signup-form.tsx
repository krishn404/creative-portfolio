"use client"

import { FormEvent, useState } from "react"
import { useSearchParams } from "next/navigation"

export function LetterSignupForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [error, setError] = useState("")

  const source = searchParams.get("src")?.trim().slice(0, 80) || undefined

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("submitting")
    setError("")

    try {
      const response = await fetch("/api/letter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, website }),
      })
      const payload: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : "Something went wrong. Please try again."
        throw new Error(message)
      }
      setStatus("success")
      setEmail("")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.")
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className="border border-black bg-[var(--accent-neon)] p-5" role="status">
        <p className="blog-font-headline text-xl font-semibold">You&apos;re on the list.</p>
        <p className="mt-2 text-sm leading-6">See you in the next letter.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <label htmlFor="letter-email" className="blog-font-mono block text-[10px] tracking-[0.14em]">
        Email address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="letter-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@email.com"
          className="min-h-12 flex-1 border border-black bg-[var(--surface)] px-4 text-base outline-none placeholder:text-neutral-500 focus:ring-2 focus:ring-[var(--accent-neon)]"
          aria-describedby={error ? "letter-error" : undefined}
          disabled={status === "submitting"}
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="blog-font-headline min-h-12 border border-black bg-black px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-neon)] hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? "Joining..." : "Join the letter"}
        </button>
      </div>
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="letter-website">Website</label>
        <input
          id="letter-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>
      {error && <p id="letter-error" className="text-sm text-red-700" role="alert">{error}</p>}
      <p className="text-xs leading-5 text-[var(--text-secondary)]">No spam. Just one letter a month.</p>
    </form>
  )
}
