/** Public hostname only (for robots Host directive and URL building). */
export const SITE_HOST = "art.krixnx.xyz"

/** Canonical site origin; always HTTPS, no trailing slash. */
export const SITE_URL = `https://${SITE_HOST}`
export const SITE_NAME = "kantcancook Portfolio"
export const CREATOR_NAME = "kantcancook"
export const CREATOR_ALIASES = ["kantcancook", "psyx"] as const
export const CREATOR_INSTAGRAM = "https://instagram.com/kantcancook"
export const DEFAULT_OG_IMAGE = "/api/og?title=kantcancook%20Portfolio"

export const PRIMARY_KEYWORDS = [
  "kantcancook",
  "kantcancook portfolio",
  "kantcancook instagram",
  "art.krixnx.xyz",
  "graphic designer portfolio",
  "creative developer",
  "digital artist",
  "experimental designer",
  "visual storytelling",
  "creative technologist",
] as const

export const KNOWS_ABOUT = [
  "graphic design",
  "creative development",
  "visual art",
  "digital artwork",
  "creative coding",
  "interactive web experiences",
  "experimental visual design",
  "visual storytelling",
] as const

export const IDENTITY_STATEMENTS = [
  "kantcancook is a graphic designer and creative developer focused on experimental visual design, digital artwork, creative coding, and interactive web experiences.",
  "art.krixnx.xyz is the official portfolio website of kantcancook, also known as psyx.",
  "The Instagram profile instagram.com/kantcancook is the official social identity connected to this portfolio.",
  "kantcancook works across visual storytelling, poster design, and digital-first creative direction.",
] as const
