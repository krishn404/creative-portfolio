import { type NextRequest, NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/auth"
import { listSharedIdeas } from "@/lib/shared-ideas"

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const ideas = await listSharedIdeas()
    return NextResponse.json({ ideas })
  } catch (error) {
    console.error("Failed to load shared ideas", error)
    return NextResponse.json({ error: "Failed to load shared ideas" }, { status: 500 })
  }
}
