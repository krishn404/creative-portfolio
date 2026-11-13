import { NextRequest, NextResponse } from "next/server"
import { getAdminSessionToken, isAuthenticated } from "@/lib/auth"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validContent(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 20_000
}

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body: unknown = await request.json().catch(() => null)
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  const { kind, email, subject, workUpdate, affirmation } = body as Record<string, unknown>
  if (!validContent(subject) || !validContent(workUpdate) || !validContent(affirmation)) {
    return NextResponse.json({ error: "Subject, work update, and affirmation are required." }, { status: 400 })
  }

  const adminToken = getAdminSessionToken()
  try {
    if (kind === "test") {
      if (typeof email !== "string" || !emailPattern.test(email.trim())) return NextResponse.json({ error: "Enter a valid test email address." }, { status: 400 })
      await convex.action(api.broadcasts.sendTest, { adminToken, email, subject, workUpdate, affirmation })
      return NextResponse.json({ ok: true })
    }
    if (kind === "broadcast") {
      const broadcastId = await convex.mutation(api.newsletter.createBroadcast, { adminToken, subject, workUpdate, affirmation })
      const result = await convex.action(api.broadcasts.sendBroadcast, { adminToken, broadcastId: broadcastId as Id<"broadcasts"> })
      return NextResponse.json({ ok: true, result })
    }
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  } catch (error) {
    console.error("Newsletter send failed:", error)
    return NextResponse.json({ error: "Newsletter sending failed. Check the configured sender and try again." }, { status: 500 })
  }
}
