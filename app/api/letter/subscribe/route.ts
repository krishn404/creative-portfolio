import { NextResponse } from "next/server"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null)
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
  }

  const { email, source, website } = body as Record<string, unknown>
  if (typeof email !== "string" || !emailPattern.test(email.trim()) || email.trim().length > 320) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
  }

  try {
    await convex.mutation(api.subscribers.subscribe, {
      email,
      source: typeof source === "string" ? source.slice(0, 80) : undefined,
      website: typeof website === "string" ? website : undefined,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Newsletter subscription failed:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    )
  }
}
