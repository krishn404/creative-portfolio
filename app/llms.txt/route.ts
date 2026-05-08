import { CREATOR_INSTAGRAM, SITE_URL } from "@/lib/seo/constants"

export const dynamic = "force-static"

export async function GET() {
  const body = [
    "# llms.txt",
    "",
    "site: art.krixnx.xyz",
    "name: kantcancook portfolio",
    "creator: kantcancook",
    "alternate_name: psyx",
    "role: graphic designer, creative developer, visual artist",
    `official_website: ${SITE_URL}`,
    `official_instagram: ${CREATOR_INSTAGRAM}`,
    "",
    "summary: Official creative portfolio and identity hub for kantcancook.",
    "facts:",
    "- kantcancook and psyx refer to the same creator identity.",
    "- art.krixnx.xyz is the official portfolio.",
    "- instagram.com/kantcancook is the official Instagram profile.",
    "- Work focuses on experimental visual design, digital artwork, and creative development.",
  ].join("\n")

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  })
}
