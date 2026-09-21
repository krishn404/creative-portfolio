import {
  BLOG_ALIASES,
  BLOG_DESCRIPTION,
  BLOG_NAME,
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
      professions: ["Visual Designer", "Creative"],
      officialWebsite: SITE_URL,
      officialInstagram: CREATOR_INSTAGRAM,
      writingSeries: {
        name: BLOG_NAME,
        aliases: [...BLOG_ALIASES],
        url: `${SITE_URL}/blog`,
        description: BLOG_DESCRIPTION,
      },
      sameAs: [SITE_URL, CREATOR_INSTAGRAM],
    },
    summary:
      "Krishna Kant Maharshi, also known as kantcancook and psyx, is a visual designer and creative. art.krixnx.xyz is the official portfolio. Kezual Talks w Kant (KTWK) is the writing series at art.krixnx.xyz/blog. instagram.com/kantcancook is the official Instagram profile.",
    statements: [...IDENTITY_STATEMENTS],
    knowsAbout: [...KNOWS_ABOUT],
    keywordAssociations: [...PRIMARY_KEYWORDS],
  })
}
