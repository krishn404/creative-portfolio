import { NextRequest, NextResponse } from "next/server"
import { isAuthenticated, getAdminSessionToken } from "@/lib/auth"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const adminToken = getAdminSessionToken()
    const format = request.nextUrl.searchParams.get("format")
    if (format === "csv") {
      const subscribers = await convex.query(api.subscribers.exportActive, { adminToken })
      const rows = ["email,source,subscribed_at", ...subscribers.map((subscriber: { email: string; source?: string; createdAt: number }) => [
        csvCell(subscriber.email),
        csvCell(subscriber.source ?? ""),
        csvCell(new Date(subscriber.createdAt).toISOString()),
      ].join(","))]
      return new NextResponse(rows.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=newsletter-subscribers.csv",
        },
      })
    }

    const search = request.nextUrl.searchParams.get("search")?.slice(0, 120) || undefined
    const overview = await convex.query(api.subscribers.getAdminOverview, { adminToken, search })
    return NextResponse.json(overview)
  } catch (error) {
    console.error("Failed to load newsletter admin data:", error)
    return NextResponse.json({ error: "Failed to load newsletter data." }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body: unknown = await request.json().catch(() => null)
  if (!body || typeof body !== "object" || Array.isArray(body) || typeof (body as Record<string, unknown>).id !== "string") {
    return NextResponse.json({ error: "Missing subscriber ID." }, { status: 400 })
  }

  try {
    const id = (body as { id: string }).id
    const result = await convex.mutation(api.subscribers.removeSubscriber, {
      adminToken: getAdminSessionToken(),
      id: id as Id<"subscribers">,
    })
    if (!result.ok) return NextResponse.json({ error: "Subscriber not found." }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to remove newsletter subscriber:", error)
    return NextResponse.json({ error: "Failed to remove subscriber." }, { status: 500 })
  }
}
