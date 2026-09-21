import { CREATOR_INSTAGRAM, SITE_URL } from "@/lib/seo/constants"

export const dynamic = "force-static"

export async function GET() {
  const body = [
    "/* TEAM */",
    "Name: Krishna Kant Maharshi",
    "Creative Alias: kantcancook",
    "Alternate Alias: psyx",
    "Role: Visual Designer & Creative",
    "",
    "/* SITE */",
    `Portfolio: ${SITE_URL}`,
    `Instagram: ${CREATOR_INSTAGRAM}`,
    "Writing: Kezual Talks w Kant (KTWK)",
    `Writing URL: ${SITE_URL}/blog`,
  ].join("\n")

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  })
}
