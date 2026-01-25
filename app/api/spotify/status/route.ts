import { NextResponse } from "next/server"
import { getSpotifyStatus } from "@/lib/spotify"

// Simple in-memory cache (for production, consider using Redis or similar)
let cache: {
  data: Awaited<ReturnType<typeof getSpotifyStatus>> | null
  timestamp: number
} | null = null

const CACHE_DURATION = 60 * 1000 // 60 seconds

export async function GET() {
  try {
    // Check cache
    const now = Date.now()
    if (cache && now - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data)
    }

    // Fetch fresh data
    const status = await getSpotifyStatus()

    // Update cache
    cache = {
      data: status,
      timestamp: now,
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error("Error in Spotify status API:", error)
    return NextResponse.json(
      { error: "Failed to fetch Spotify status" },
      { status: 500 }
    )
  }
}

