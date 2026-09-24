import { NextResponse } from "next/server"

import { getSpotifyStatus } from "@/lib/spotify"
import { SITE_URL } from "@/lib/seo/constants"

type MusicStatus = Awaited<
  ReturnType<typeof getSpotifyStatus>
>

/*
 * Simple in-memory cache.
 *
 * This prevents excessive Spotify API calls while still
 * allowing the source to recover automatically.
 */
let cache: {
  data: MusicStatus
  timestamp: number
} | null = null

const CACHE_DURATION = 60 * 1000 // 60 seconds

export async function GET() {
  try {
    const now = Date.now()

    /*
     * Return cached data only while the cache is fresh.
     */
    if (
      cache &&
      now - cache.timestamp < CACHE_DURATION
    ) {
      return NextResponse.json(cache.data, {
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      })
    }

    /*
     * =========================================================
     * 1. ALWAYS TRY SPOTIFY FIRST
     * =========================================================
     */
    const spotifyStatus =
      await getSpotifyStatus()

    /*
     * Spotify is working.
     *
     * Keep only Spotify responses in the cache.
     */
    if (spotifyStatus) {
      cache = {
        data: spotifyStatus,
        timestamp: now,
      }

      return NextResponse.json(
        spotifyStatus,
        {
          headers: {
            "Cache-Control":
              "no-store, max-age=0",
          },
        }
      )
    }

    /*
     * Spotify is unavailable. Never substitute another
     * listening-history provider in this Spotify widget.
     */
    return NextResponse.json(
      {
        isPlaying: false,
        title: "Reconnect Spotify",
        artist: "Spotify playback is currently unavailable",
        album: "",
        albumArt: "",
        url: `${SITE_URL}/api/spotify/login`,
        playedAt: null,
        progressMs: null,
        durationMs: null,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    )
  } catch (error) {
    console.error(
      "Error in Spotify status API:",
      error
    )

    return NextResponse.json(
      {
        error: "Failed to fetch music status",
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    )
  }
}
