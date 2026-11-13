"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"

export function UnsubscribeConfirmation() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const [status, setStatus] = useState<"ready" | "submitting" | "success" | "error">("ready")
  const [error, setError] = useState("")

  async function unsubscribe() {
    if (!id) {
      setError("This unsubscribe link is invalid or expired.")
      setStatus("error")
      return
    }

    setStatus("submitting")
    setError("")
    try {
      const response = await fetch("/api/letter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const payload: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : "Something went wrong. Please try again."
        throw new Error(message)
      }
      setStatus("success")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.")
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className="border border-black bg-[var(--accent-neon)] p-5" role="status">
        <p className="blog-font-headline text-xl font-semibold">You&apos;re unsubscribed.</p>
        <p className="mt-2 text-sm leading-6">You won&apos;t receive any more monthly letters.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="blog-font-body text-[var(--text-secondary)]">You&apos;ll stop receiving monthly letters and affirmation postcards.</p>
      <button
        type="button"
        onClick={unsubscribe}
        disabled={status === "submitting" || !id}
        className="blog-font-headline min-h-12 w-full border border-black bg-black px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-neon)] hover:text-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? "Unsubscribing..." : "Confirm unsubscribe"}
      </button>
      {!id && <p className="text-sm text-red-700" role="alert">This unsubscribe link is invalid or expired.</p>}
      {error && id && <p className="text-sm text-red-700" role="alert">{error}</p>}
    </div>
  )
}
