import { createHash, randomUUID } from "crypto"
import type { NextRequest } from "next/server"
import { BLOG_READER_SESSION_COOKIE } from "@/lib/blog/view-tracking.constants"

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }

  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  )
}

export function getOrCreateReaderSessionId(request: NextRequest): string {
  const existing = request.cookies.get(BLOG_READER_SESSION_COOKIE)?.value
  if (existing && existing.length >= 16) return existing
  return randomUUID()
}

export function buildVisitorKey(slug: string, sessionId: string, ip: string): string {
  const normalizedIp = ip.trim().toLowerCase()
  const payload = `${slug}|${sessionId}|${normalizedIp}`
  return createHash("sha256").update(payload).digest("hex")
}

export function getViewSecret(): string {
  return process.env.BLOG_VIEW_SECRET || process.env.ADMIN_SESSION_TOKEN || "dev-blog-view-secret"
}
