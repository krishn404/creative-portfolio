import { ImageResponse } from "next/og"
import { CREATOR_NAME, SITE_URL } from "@/lib/seo/constants"

export const runtime = "edge"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get("title") ?? `${CREATOR_NAME} Portfolio`
  const subtitle =
    searchParams.get("subtitle") ?? "Graphic Designer • Creative Developer • Visual Artist"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at 20% 20%, #343434 0%, #0f0f0f 40%, #070707 100%)",
          color: "#f5f5f5",
          padding: "72px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ fontSize: 32, letterSpacing: 1.5, opacity: 0.8 }}>{SITE_URL}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 80, lineHeight: 1.1, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 34, opacity: 0.9 }}>{subtitle}</div>
        </div>
        <div style={{ fontSize: 30, opacity: 0.75 }}>@kantcancook / psyx</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
