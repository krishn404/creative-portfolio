import { NextRequest, NextResponse } from "next/server"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import {
  buildVisitorKey,
  getClientIp,
  getOrCreateReaderSessionId,
  getViewSecret,
} from "@/lib/blog/view-tracking.server"
import { BLOG_READER_SESSION_COOKIE } from "@/lib/blog/view-tracking.constants"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ slug: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params
  if (!slug || slug.length > 200) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 })
  }

  const sessionId = getOrCreateReaderSessionId(request)
  const ip = getClientIp(request)
  const visitorKey = buildVisitorKey(slug, sessionId, ip)

  try {
    const result = await convex.mutation(api.posts.recordPostView, {
      slug,
      visitorKey,
      secret: getViewSecret(),
    })

    const response = NextResponse.json(result)
    if (!request.cookies.get(BLOG_READER_SESSION_COOKIE)?.value) {
      response.cookies.set(BLOG_READER_SESSION_COOKIE, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      })
    }
    return response
  } catch {
    return NextResponse.json({ counted: false, views: null }, { status: 500 })
  }
}
