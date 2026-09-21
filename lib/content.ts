export const WORK_CATEGORIES = ["Posters", "Thumbnails", "Apparel"] as const
export type WorkCategory = (typeof WORK_CATEGORIES)[number]
export const GALLERY_FILTERS = ["All", ...WORK_CATEGORIES] as const
export type GalleryFilter = (typeof GALLERY_FILTERS)[number]

export type WorkItem = {
  id: string
  img: string
  media?: MediaAsset[]
  title: string
  year?: string
  publicId?: string
  category?: WorkCategory | "Graphic Clothing" | string
  status?: "draft" | "published" | "archived"
  showInAbout?: boolean
}

export type MediaAsset = {
  url: string
  publicId?: string
  type: "image" | "video"
  order: number
}

export type SiteContent = {
  about: {
    headline: string
    paragraphs: string[]
    tags: string[]
  }
  works: WorkItem[]
  contact: {
    email: string
    cta: string
    socials: { label: string; href: string }[]
  }
  footer?: {
    note: string
  }
}

export const ABOUT_HEADLINE =
  "I make visuals for things I care about music, film, culture, people, and the weird ideas that live somewhere in between."

export const ABOUT_PARAGRAPHS = [
  "Posters · Cover Art · Campaigns · Identity · Visual Direction · Writing",
]

export const ABOUT_TAGS = [
  "Poster design",
  "Cover artwork",
  "Campaign visuals",
  "Art direction",
  "Social content",
  "Writing",
  "Basic video editing",
  "Apparel graphics",
]

export const CONTACT_CTA = [
  "I’m available for poster design, cover artwork, campaign visuals, creative direction, writing, and selected freelance collaborations.",
  "Tell me what you’re making, what you need, and when you need it.",
].join("\n\n")

export function normalizeWorkCategory(category?: string): WorkCategory | undefined {
  if (!category) return undefined
  if (category === "Graphic Clothing" || category === "Apparel") return "Apparel"
  if (category === "Posters" || category === "Thumbnails") return category
  return undefined
}

export function displayWorkCategory(category?: string): string {
  return normalizeWorkCategory(category) ?? category ?? "Selected Work"
}

export function workMatchesCategory(work: WorkItem, category: GalleryFilter): boolean {
  if (category === "All") return true
  return normalizeWorkCategory(work.category) === category
}

export const getDefaultContent = (): SiteContent => ({
  about: {
    headline: ABOUT_HEADLINE,
    paragraphs: ABOUT_PARAGRAPHS,
    tags: ABOUT_TAGS,
  },
  works: [],
  contact: {
    email: "psyxdes@gmail.com",
    cta: CONTACT_CTA,
    socials: [
      { label: "Instagram", href: "https://instagram.com/kantcancook" },
      { label: "Pinterest", href: "https://pinterest.com/psyxyx" },
      { label: "Email", href: "mailto:psyxdes@gmail.com" },
    ],
  },
  footer: {
    note: "© 2026 Krishna Kant Maharshi. All rights reserved.",
  },
})

export async function readContent(): Promise<SiteContent> {
  try {
    const { convex } = await import("@/lib/convex")
    const { api } = await import("@/convex/_generated/api")

    const content = await convex.query(api.content.get)
    const works = await convex.query(api.works.listAll)

    return { ...content, works } as SiteContent
  } catch (error) {
    console.error("Failed to read content from Convex:", error)
    return getDefaultContent()
  }
}
