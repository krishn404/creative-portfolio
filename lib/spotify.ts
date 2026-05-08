/**
 * Spotify API utilities for token management and API calls
 */

interface SpotifyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope?: string
}

interface SpotifyNowPlayingResponse {
  is_playing: boolean
  progress_ms: number
  item: {
    name: string
    duration_ms: number
    artists: Array<{ name: string }>
    album: {
      name: string
      images: Array<{ url: string; height: number; width: number }>
    }
    external_urls: {
      spotify: string
    }
  } | null
  timestamp: number
}

interface SpotifyPlayerResponse {
  is_playing: boolean
  progress_ms: number
  item: {
    name: string
    duration_ms: number
    artists: Array<{ name: string }>
    album: {
      name: string
      images: Array<{ url: string; height: number; width: number }>
    }
    external_urls: {
      spotify: string
    }
  } | null
  timestamp: number
}

interface SpotifyRecentlyPlayedResponse {
  items: Array<{
    track: {
      name: string
      artists: Array<{ name: string }>
      album: {
        name: string
        images: Array<{ url: string; height: number; width: number }>
      }
      external_urls: {
        spotify: string
      }
    }
    played_at: string
  }>
}

export interface SpotifyStatus {
  isPlaying: boolean
  title: string
  artist: string
  album: string
  albumArt: string
  url: string
  playedAt: number | null
  progressMs: number | null
  durationMs: number | null
}

/**
 * Get access token using refresh token
 */
export async function getAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Spotify credentials in environment variables")
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh token: ${error}`)
  }

  const data: SpotifyTokenResponse = await response.json()
  return data.access_token
}

/**
 * Get current playing track or last played track
 */
export async function getSpotifyStatus(): Promise<SpotifyStatus | null> {
  try {
    const accessToken = await getAccessToken()

    // First, try to get currently playing track
    const nowPlayingResponse = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (nowPlayingResponse.status === 204) {
      // No content - nothing is playing, fetch recently played
      return await getLastPlayed(accessToken)
    }

    if (nowPlayingResponse.ok) {
      const data: SpotifyNowPlayingResponse = await nowPlayingResponse.json()
      
      if (data.item) {
        return {
          isPlaying: data.is_playing,
          title: data.item.name,
          artist: data.item.artists.map((a) => a.name).join(", "),
          album: data.item.album.name,
          albumArt: data.item.album.images[0]?.url || "",
          url: data.item.external_urls.spotify,
          playedAt: data.timestamp,
          progressMs: data.progress_ms || null,
          durationMs: data.item.duration_ms || null,
        }
      }
    }

    // Some accounts/contexts are more reliable through /me/player.
    const playerResponse = await fetch("https://api.spotify.com/v1/me/player", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (playerResponse.ok) {
      const data: SpotifyPlayerResponse = await playerResponse.json()

      if (data.item) {
        return {
          isPlaying: data.is_playing,
          title: data.item.name,
          artist: data.item.artists.map((a) => a.name).join(", "),
          album: data.item.album.name,
          albumArt: data.item.album.images[0]?.url || "",
          url: data.item.external_urls.spotify,
          playedAt: data.timestamp,
          progressMs: data.progress_ms || null,
          durationMs: data.item.duration_ms || null,
        }
      }
    }

    // If currently playing fails, try recently played
    return await getLastPlayed(accessToken)
  } catch (error) {
    console.error("Error fetching Spotify status:", error)
    return null
  }
}

/**
 * Get last played track
 */
async function getLastPlayed(accessToken: string): Promise<SpotifyStatus | null> {
  try {
    const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      console.error("Failed to fetch recently played track:", response.status, await response.text())
      return null
    }

    const data: SpotifyRecentlyPlayedResponse = await response.json()

    if (data.items && data.items.length > 0) {
      const item = data.items[0]
      return {
        isPlaying: false,
        title: item.track.name,
        artist: item.track.artists.map((a) => a.name).join(", "),
        album: item.track.album.name,
        albumArt: item.track.album.images[0]?.url || "",
        url: item.track.external_urls.spotify,
        playedAt: new Date(item.played_at).getTime(),
        progressMs: null,
        durationMs: null,
      }
    }

    return null
  } catch (error) {
    console.error("Error fetching last played track:", error)
    return null
  }
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{ accessToken: string; refreshToken: string }> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Spotify credentials in environment variables")
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code: ${error}`)
  }

  const data: SpotifyTokenResponse = await response.json()

  if (!data.refresh_token) {
    throw new Error("No refresh token received")
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  }
}

