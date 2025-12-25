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
    console.error("Failed to fetch content from Convex:", error)
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === "development" 
      ? `Convex error: ${error instanceof Error ? error.message : String(error)}`
      : "Failed to load content"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
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
    console.error("Failed to save content to Convex:", error)
    const errorMessage = process.env.NODE_ENV === "development" 
      ? `Convex error: ${error instanceof Error ? error.message : String(error)}`
      : "Failed to save content"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
