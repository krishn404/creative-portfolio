"use client"

import { useEffect } from "react"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"

export function IncrementViews({ slug }: { slug: string }) {
  useEffect(() => {
    convex.mutation(api.posts.incrementPostViews, { slug }).catch(() => {})
  }, [slug])

  return null
}
