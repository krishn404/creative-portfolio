"use client"

import { useEffect, useRef } from "react"
import { VIEW_SESSION_STORAGE_PREFIX } from "@/lib/blog/view-tracking.constants"

export function IncrementViews({ slug }: { slug: string }) {
  const trackedRef = useRef(false)

  useEffect(() => {
    if (trackedRef.current) return

    const storageKey = `${VIEW_SESSION_STORAGE_PREFIX}${slug}`
    if (typeof window !== "undefined" && sessionStorage.getItem(storageKey)) {
      trackedRef.current = true
      return
    }

    trackedRef.current = true

    fetch(`/api/blog/${encodeURIComponent(slug)}/view`, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) return null
        return response.json() as Promise<{ counted?: boolean }>
      })
      .then((result) => {
        if (result?.counted) {
          sessionStorage.setItem(storageKey, String(Date.now()))
        }
      })
      .catch(() => {})
  }, [slug])

  return null
}
