export type WorkItem = {
  id: string
  img: string
  media?: MediaAsset[]
  title: string
  year?: string
  publicId?: string
  category?: "Posters" | "Thumbnails" | "Graphic Clothing"
  status?: "draft" | "published" | "archived"
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
    headline: "Building stories through design and creativity",
    paragraphs: [
      "I am the Creative Head at The Blackbombay House, a music production company where I manage and create visual work across different areas like social media, branding, video editing, and storytelling.",
      "My work includes graphic design, writing copy and scripts, basic video editing, and leading creative campaigns that connect with people. I enjoy shaping ideas into visuals that tell clear and engaging stories.",
      "Open for freelance, collaboration, and creative roles in design, content, and media.",
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
