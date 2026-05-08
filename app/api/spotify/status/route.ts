import { NextResponse } from "next/server"
import { getSpotifyStatus } from "@/lib/spotify"
import { SITE_URL } from "@/lib/seo/constants"
import { getLastFmStatus } from "@/lib/lastfm"

// Simple in-memory cache (for production, consider using Redis or similar)
let cache: {
  data: Awaited<ReturnType<typeof getSpotifyStatus>> | null
  timestamp: number
} | null = null

const CACHE_DURATION = 60 * 1000 // 60 seconds
let lastSuccessfulStatus: Awaited<ReturnType<typeof getSpotifyStatus>> | null = null

export async function GET() {
  try {
    // Check cache
    const now = Date.now()
    if (cache && cache.data && now - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data)
    }

    // Fetch fresh data
    const spotifyStatus = await getSpotifyStatus()
    const lastFmStatus = spotifyStatus ? null : await getLastFmStatus()
    const status = spotifyStatus ?? lastFmStatus
    const resolvedStatus = status ?? lastSuccessfulStatus

    if (status) {
      lastSuccessfulStatus = status
      cache = {
        data: status,
        timestamp: now,
      }
    }

    if (resolvedStatus) {
      return NextResponse.json(resolvedStatus)
    }

    return NextResponse.json({
      isPlaying: false,
      title: "No recent playback found",
      artist: "Connect Spotify Premium or set Last.fm API env vars",
      album: "",
      albumArt: "",
      url: `${SITE_URL}/api/spotify/login`,
      playedAt: null,
      progressMs: null,
      durationMs: null,
    })
  } catch (error) {
    console.error("Error in Spotify status API:", error)
    return NextResponse.json(
      { error: "Failed to fetch Spotify status" },
      { status: 500 }
    )
  }
}

