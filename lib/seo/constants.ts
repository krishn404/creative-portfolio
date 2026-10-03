/** Canonical site origin; defaults to the production hostname. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://art.krixnx.xyz").replace(/\/$/, "")
export const SITE_HOST = new URL(SITE_URL).host
export const SITE_NAME = "Krishna Kant Maharshi"
export const CREATOR_NAME = "Krishna Kant Maharshi"
export const CREATOR_ALIASES = ["kantcancook", "kant can cook", "psyx"] as const
export const CREATOR_INSTAGRAM = "https://instagram.com/kantcancook"
export const CREATOR_PINTEREST = "https://pinterest.com/psyxyx"
export const CREATOR_PROFILES = [CREATOR_INSTAGRAM, CREATOR_PINTEREST] as const
export const BLOG_NAME = "Kezual Talks w Kant"
export const BLOG_ALIASES = [
  "KTWK",
  "Kezual Talks with Kant",
  "Kezual Talks w Kant",
  "Kezual Talks w/ Kant",
] as const
export const BLOG_DESCRIPTION =
  "Kezual Talks w Kant (KTWK): conversations, interviews, reviews, and notes on artists, music, and the people shaping culture."
export const DEFAULT_OG_IMAGE = "/api/og?title=Krishna%20Kant%20Maharshi"

export const PRIMARY_KEYWORDS = [
  "Krishna Kant Maharshi",
  "kantcancook",
  "kant can cook",
  "kantcancook portfolio",
  "kantcancook instagram",
  "Kezual Talks w Kant",
  "Kezual Talks w/ Kant",
  "KTWK",
  "art.krixnx.xyz",
  "visual designer",
  "poster design",
  "cover artwork",
  "campaign visuals",
  "apparel graphics",
  "music and film design",
] as const

export const KNOWS_ABOUT = [
  "poster design",
  "cover artwork",
  "campaign visuals",
  "art direction",
  "social content",
  "writing",
  "apparel graphics",
  "visual direction",
] as const

export const IDENTITY_STATEMENTS = [
  "Krishna Kant Maharshi, also known as kantcancook and psyx, is a visual designer and creative working across music, film, culture, and apparel.",
  "art.krixnx.xyz is the official portfolio website of Krishna Kant Maharshi, also known as kantcancook and psyx.",
  "The Instagram profile instagram.com/kantcancook is the official social identity connected to this portfolio.",
  "Kezual Talks w Kant (KTWK) is the interview and writing series by kantcancook at art.krixnx.xyz/blog.",
  "The work includes posters, cover artwork, campaign visuals, writing, and creative direction.",
] as const
