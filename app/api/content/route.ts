import { NextRequest, NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/auth"
import { readContent, writeContent, type SiteContent } from "@/lib/content"

export async function GET() {
  const content = await readContent()
  return NextResponse.json(content)
}

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const incoming = (await request.json().catch(() => ({}))) as Partial<SiteContent>
  const current = await readContent()
  const merged: SiteContent = {
    about: incoming.about ?? current.about,
    contact: incoming.contact ?? current.contact,
    works: current.works,
    footer: incoming.footer ?? current.footer,
  }

  await writeContent(merged)
  return NextResponse.json(merged)
}

