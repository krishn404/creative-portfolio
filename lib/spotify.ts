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
    artists: Array<{
      name: string
    }>
    album: {
      name: string
      images: Array<{
        url: string
        height: number
        width: number
      }>
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
      artists: Array<{
        name: string
      }>
      album: {
        name: string
        images: Array<{
          url: string
          height: number
          width: number
        }>
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
 * Get a fresh Spotify access token using the refresh token.
 */
export async function getAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Spotify credentials in environment variables"
    )
  }

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${clientId}:${clientSecret}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    const error = await response.text()

    throw new Error(
      `Failed to refresh Spotify token: ${error}`
    )
  }

  const data: SpotifyTokenResponse =
    await response.json()

  return data.access_token
}

/**
 * Get the current Spotify track.
 *
 * Returns:
 * - Spotify track when something is playing
 * - Spotify recently played when nothing is currently playing
 * - null only when Spotify itself is unavailable
 *
 * The music widget never substitutes Last.fm data.
 */
export async function getSpotifyStatus(): Promise<SpotifyStatus | null> {
  try {
    const accessToken = await getAccessToken()

    const nowPlayingResponse = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    )

    console.log(
      "Spotify currently-playing status:",
      nowPlayingResponse.status
    )

    /**
     * 204 means Spotify is working.
     * There is simply no track currently playing.
     *
     * This is NOT a Spotify failure.
     */
    if (nowPlayingResponse.status === 204) {
      return await getLastPlayed(accessToken)
    }

    /**
     * Spotify responded successfully.
     */
    if (nowPlayingResponse.ok) {
      const data: SpotifyNowPlayingResponse =
        await nowPlayingResponse.json()

      if (data.item) {
        return {
          isPlaying: data.is_playing,
          title: data.item.name,
          artist: data.item.artists
            .map((artist) => artist.name)
            .join(", "),
          album: data.item.album.name,
          albumArt:
            data.item.album.images[0]?.url || "",
          url: data.item.external_urls.spotify,
          playedAt: data.timestamp,
          progressMs: data.progress_ms ?? null,
          durationMs:
            data.item.duration_ms ?? null,
        }
      }

      /**
       * Spotify is healthy but has no current item.
       * Use Spotify's recently played history.
       */
      return await getLastPlayed(accessToken)
    }

    /**
     * Spotify itself failed.
     *
     * Returning null tells the API route Spotify is
     * unavailable so it can ask the user to reconnect.
     */
    const errorBody = await nowPlayingResponse.text()

    console.error(
      "Spotify currently-playing failed:",
      nowPlayingResponse.status,
      errorBody
    )

    return null
  } catch (error) {
    console.error(
      "Spotify status failed:",
      error
    )

    return null
  }
}

/**
 * Get the most recently played Spotify track.
 */
async function getLastPlayed(
  accessToken: string
): Promise<SpotifyStatus | null> {
  try {
    const response = await fetch(
      "https://api.spotify.com/v1/me/player/recently-played?limit=1",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    )

    console.log(
      "Spotify recently-played status:",
      response.status
    )

    if (!response.ok) {
      const errorBody = await response.text()

      console.error(
        "Failed to fetch Spotify recently played:",
        response.status,
        errorBody
      )

      return null
    }

    const data: SpotifyRecentlyPlayedResponse =
      await response.json()

    if (!data.items?.length) {
      return null
    }

    const item = data.items[0]

    return {
      isPlaying: false,
      title: item.track.name,
      artist: item.track.artists
        .map((artist) => artist.name)
        .join(", "),
      album: item.track.album.name,
      albumArt:
        item.track.album.images[0]?.url || "",
      url: item.track.external_urls.spotify,
      playedAt: new Date(
        item.played_at
      ).getTime(),
      progressMs: null,
      durationMs: null,
    }
  } catch (error) {
    console.error(
      "Error fetching Spotify recently played:",
      error
    )

    return null
  }
}

/**
 * Exchange Spotify authorization code for tokens.
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<{
  accessToken: string
  refreshToken: string
}> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing Spotify credentials in environment variables"
    )
  }

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${clientId}:${clientSecret}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    const error = await response.text()

    throw new Error(
      `Failed to exchange Spotify code: ${error}`
    )
  }

  const data: SpotifyTokenResponse =
    await response.json()

  if (!data.refresh_token) {
    throw new Error(
      "No Spotify refresh token received"
    )
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  }
}
