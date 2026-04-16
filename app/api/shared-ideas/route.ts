import { NextResponse } from "next/server"
import { appendSharedIdea, type SharedIdea } from "@/lib/shared-ideas"

export async function POST(request: Request) {
  try {
    const incoming = (await request.json()) as Omit<SharedIdea, "id" | "createdAt">
    const transcript = incoming.transcript?.trim() || incoming.textFallback?.trim() || ""

    if (!transcript) {
      return NextResponse.json({ error: "Missing transcript" }, { status: 400 })
    }

    const payload: SharedIdea = {
      ...incoming,
      transcript,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }

    await appendSharedIdea(payload)
    return NextResponse.json({ ok: true, id: payload.id })
  } catch (error) {
    console.error("Failed to save shared idea", error)
    return NextResponse.json({ error: "Failed to save shared idea" }, { status: 500 })
  }
}
