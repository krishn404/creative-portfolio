import { type NextRequest, NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/auth"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import type { WorkItem } from "@/lib/content"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const showAll = searchParams.get("all") === "true"

  try {
    const works = showAll ? await convex.query(api.works.listAll) : await convex.query(api.works.listPublished)

    return NextResponse.json({ works })
  } catch (error) {
    console.error("Failed to fetch works from Convex:", error)
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === "development" 
      ? `Convex error: ${error instanceof Error ? error.message : String(error)}`
      : "Failed to load works"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const work = (await request.json()) as WorkItem

    const result = await convex.mutation(api.works.upsert, {
      id: work.id,
      title: work.title,
      img: work.img,
      year: work.year,
      publicId: work.publicId,
      category: work.category,
      status: work.status,
      media: work.media,
    })

    return NextResponse.json({ ok: true, id: result.id })
  } catch (error) {
    console.error("Failed to save work to Convex:", error)
    const errorMessage = process.env.NODE_ENV === "development" 
      ? `Convex error: ${error instanceof Error ? error.message : String(error)}`
      : "Failed to save work"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id, status } = await request.json()

    await convex.mutation(api.works.updateStatus, { id, status })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to update work status", error)
    return NextResponse.json({ error: "Failed to update work status" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Missing work ID" }, { status: 400 })
    }

    const result = await convex.mutation(api.works.deleteWork, { id })

    return NextResponse.json({ ok: true, publicId: result.publicId })
  } catch (error) {
    console.error("Failed to delete work", error)
    return NextResponse.json({ error: "Failed to delete work" }, { status: 500 })
  }
}
