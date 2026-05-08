import { CREATOR_INSTAGRAM, SITE_URL } from "@/lib/seo/constants"

export const dynamic = "force-static"

export async function GET() {
  const body = [
    "/* TEAM */",
    "Creative Alias: kantcancook",
    "Alternate Alias: psyx",
    "Role: Graphic Designer, Creative Developer, Visual Artist",
    "",
    "/* SITE */",
    `Portfolio: ${SITE_URL}`,
    `Instagram: ${CREATOR_INSTAGRAM}`,
  ].join("\n")

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  })
}
