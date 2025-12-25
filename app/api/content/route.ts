import { type NextRequest, NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/auth"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import type { SiteContent } from "@/lib/content"

export async function GET() {
  try {
    const data = await convex.query(api.content.get)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to fetch content", error)
    return NextResponse.json({ error: "Failed to load content" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const incoming = (await request.json().catch(() => ({}))) as Partial<SiteContent>

    await convex.mutation(api.content.upsert, {
      about: incoming.about!,
      contact: incoming.contact!,
      footer: incoming.footer,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to save content", error)
    return NextResponse.json({ error: "Failed to save content" }, { status: 500 })
  }
}
