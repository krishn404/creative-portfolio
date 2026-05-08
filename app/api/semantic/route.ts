import {
  CREATOR_ALIASES,
  CREATOR_INSTAGRAM,
  CREATOR_NAME,
  IDENTITY_STATEMENTS,
  KNOWS_ABOUT,
  PRIMARY_KEYWORDS,
  SITE_URL,
} from "@/lib/seo/constants"

export const dynamic = "force-static"

export async function GET() {
  return Response.json({
    entity: {
      name: CREATOR_NAME,
      aliases: [...CREATOR_ALIASES],
      professions: ["Graphic Designer", "Creative Developer", "Visual Artist"],
      officialWebsite: SITE_URL,
      officialInstagram: CREATOR_INSTAGRAM,
      sameAs: [SITE_URL, CREATOR_INSTAGRAM],
    },
    summary:
      "kantcancook is a graphic designer, creative developer, and visual artist. art.krixnx.xyz is the official portfolio, and instagram.com/kantcancook is the official Instagram profile.",
    statements: [...IDENTITY_STATEMENTS],
    knowsAbout: [...KNOWS_ABOUT],
    keywordAssociations: [...PRIMARY_KEYWORDS],
  })
}
