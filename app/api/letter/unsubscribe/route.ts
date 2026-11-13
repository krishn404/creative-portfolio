import { NextResponse } from "next/server"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null)
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "This unsubscribe link is invalid or expired." }, { status: 400 })
  }

  const { id } = body as Record<string, unknown>
  if (typeof id !== "string" || !id.trim()) {
    return NextResponse.json({ error: "This unsubscribe link is invalid or expired." }, { status: 400 })
  }

  try {
    const result = await convex.mutation(api.subscribers.unsubscribe, { id: id as Id<"subscribers"> })
    if (!result.ok) {
      return NextResponse.json({ error: "This unsubscribe link is invalid or expired." }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Newsletter unsubscribe failed:", error)
    return NextResponse.json({ error: "This unsubscribe link is invalid or expired." }, { status: 400 })
  }
}
