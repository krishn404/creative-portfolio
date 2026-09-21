import { NextResponse } from "next/server"

import { getSpotifyStatus } from "@/lib/spotify"
import { getLastFmStatus } from "@/lib/lastfm"
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
     * This immediately replaces any previously cached
     * Last.fm response.
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
     * =========================================================
     * 2. SPOTIFY FAILED -> TRY LAST.FM
     * =========================================================
     */
    console.warn(
      "Spotify unavailable. Falling back to Last.fm."
    )

    const lastFmStatus =
      await getLastFmStatus()

    if (lastFmStatus) {
      cache = {
        data: lastFmStatus,
        timestamp: now,
      }

      return NextResponse.json(
        lastFmStatus,
        {
          headers: {
            "Cache-Control":
              "no-store, max-age=0",
          },
        }
      )
    }

    /*
     * =========================================================
     * 3. BOTH SOURCES FAILED
     * =========================================================
     *
     * Do NOT return an old successful status.
     *
     * This is important because an old Last.fm result must
     * not remain visible after Spotify becomes available again.
     */
    return NextResponse.json(
      {
        isPlaying: false,
        title: "No recent playback found",
        artist:
          "Connect Spotify Premium or set Last.fm API env vars",
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