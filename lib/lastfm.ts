import type { SpotifyStatus } from "@/lib/spotify"

interface LastFmImage {
  "#text": string
  size: "small" | "medium" | "large" | "extralarge"
}

interface LastFmTrack {
  name: string
  url: string
  artist: {
    "#text": string
  }
  album: {
    "#text": string
  }
  image?: LastFmImage[]
  date?: {
    uts: string
  }
  "@attr"?: {
    nowplaying?: "true"
  }
}

interface LastFmRecentTracksResponse {
  recenttracks?: {
    track?: LastFmTrack[]
  }
}

function getBestImage(images: LastFmImage[] | undefined): string {
  if (!images || images.length === 0) return ""
  const preferredOrder: Array<LastFmImage["size"]> = ["extralarge", "large", "medium", "small"]
  for (const size of preferredOrder) {
    const image = images.find((img) => img.size === size && img["#text"])
    if (image?.["#text"]) return image["#text"]
  }
  return images[0]?.["#text"] ?? ""
}

export async function getLastFmStatus(): Promise<SpotifyStatus | null> {
  const apiKey = process.env.LASTFM_API_KEY
  const username = process.env.LASTFM_USERNAME

  if (!apiKey || !username) {
    return null
  }

  const params = new URLSearchParams({
    method: "user.getrecenttracks",
    user: username,
    api_key: apiKey,
    format: "json",
    limit: "1",
  })

  const response = await fetch(`https://ws.audioscrobbler.com/2.0/?${params.toString()}`, {
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    console.error("Failed to fetch Last.fm status:", response.status, await response.text())
    return null
  }

  const data: LastFmRecentTracksResponse = await response.json()
  const track = data.recenttracks?.track?.[0]
  if (!track) return null

  const isNowPlaying = track["@attr"]?.nowplaying === "true"

  return {
    isPlaying: isNowPlaying,
    title: track.name || "Unknown track",
    artist: track.artist?.["#text"] || "Unknown artist",
    album: track.album?.["#text"] || "",
    albumArt: getBestImage(track.image),
    url: track.url || "https://www.last.fm",
    playedAt: track.date?.uts ? Number(track.date.uts) * 1000 : Date.now(),
    progressMs: null,
    durationMs: null,
  }
}
