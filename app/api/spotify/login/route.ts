import { NextResponse } from "next/server"

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Missing Spotify configuration" },
      { status: 500 }
    )
  }

  const scopes = [
    "user-read-currently-playing",
    "user-read-recently-played",
  ].join(" ")

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: scopes,
  })

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`

  return NextResponse.redirect(authUrl)
}

