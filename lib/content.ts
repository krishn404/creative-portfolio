export type WorkItem = {
  id: string
  img: string
  media?: MediaAsset[]
  title: string
  year?: string
  publicId?: string
  category?: "Posters" | "Thumbnails" | "Graphic Clothing"
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

export const getDefaultContent = (): SiteContent => ({
  about: {
    headline: "I work in visuals across music, brands, and apparel.",
    paragraphs: [
      "My work spans music covers, corporate visuals, and apparel including shirts, tees, and bottomwear, alongside freelance projects while managing all Design direction at The BlackBombay House. For major artworks and core visual direction I work primarily in [[tool|Photoshop|photoshop]] and for structured design needs like corporate assets, carousels, and rapid layouts I rely on [[tool|Canva|canva]]. Visually, my work operates between chaos and darker aesthetics, driven by raw textures and deliberate imperfection, while staying open to continuous experimentation.",
    ],
    tags: ["Creative Direction", "Graphic Design", "Video Editing", "Copywriting", "Social Media Creatives"],
  },
  works: [],
  contact: {
    email: "psyxdes@gmail.com",
    cta: "Interested in collaborating or commissioning a piece? I'd love to hear about your project.",
    socials: [
      { label: "Instagram", href: "https://instagram.com/kantcancook" },
      { label: "Pinterest", href: "https://pinterest.com/psyxyx" },
      { label: "Email", href: "mailto:psyxdes@gmail.com" },
    ],
  },
  footer: {
    note: "© 2025 Krishnakant Maharshi. All rights reserved.",
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
