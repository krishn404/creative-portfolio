import { getAdminSupabase } from "@/lib/supabase/admin"

export type WorkItem = {
  id: string
  img: string
  title: string
  year?: string
  publicId?: string
  category?: "Posters" | "Thumbnails" | "Graphic Clothing"
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

const defaultContent: SiteContent = {
  about: {
    headline: "Building stories through design and creativity",
    paragraphs: [
      "I am the Creative Head at The Blackbombay House, a music production company where I manage and create visual work across different areas like social media, branding, video editing, and storytelling.",
      "My work includes graphic design, writing copy and scripts, basic video editing, and leading creative campaigns that connect with people. I enjoy shaping ideas into visuals that tell clear and engaging stories.",
      "Open for freelance, collaboration, and creative roles in design, content, and media.",
    ],
    tags: [
      "Creative Direction",
      "Graphic Design",
      "Video Editing",
      "Copywriting",
      "Social Media Creatives",
    ],
  },
  works: [],
  contact: {
    email: "psyxdes@gmail.com",
    cta: "Interested in collaborating or commissioning a piece? I'd love to hear about your project.",
    socials: [
      { label: "Instagram", href: "https://instagram.com/kantcancook" },
      { label: "Pinterest", href: "https://pinterest.com/psyxyx" },
      { label: "LinkedIn", href: "https://linkedin.com/in/krishn404" },
      { label: "Email", href: "mailto:psyxdes@gmail.com" },
    ],
  },
  footer: {
    note: "© 2025 Krishnakant Maharshi. All rights reserved.",
  },
}

export async function readContent(): Promise<SiteContent> {
  const supabase = getAdminSupabase()

  const { data: existing, error } = await supabase
    .from("content")
    .select("about, contact, footer")
    .eq("id", "singleton")
    .single()

  if (error) {
    console.error("Failed to read content, seeding defaults", error)
    await supabase.from("content").upsert({
      id: "singleton",
      about: defaultContent.about,
      contact: defaultContent.contact,
      footer: defaultContent.footer,
    })
    return { ...defaultContent, works: await listWorks() }
  }

  return {
    about: existing?.about ?? defaultContent.about,
    contact: existing?.contact ?? defaultContent.contact,
    footer: existing?.footer ?? defaultContent.footer,
    works: await listWorks(),
  }
}

export async function writeContent(content: SiteContent) {
  const supabase = getAdminSupabase()

  await supabase.from("content").upsert({
    id: "singleton",
    about: content.about ?? defaultContent.about,
    contact: content.contact ?? defaultContent.contact,
    footer: content.footer ?? defaultContent.footer,
    updated_at: new Date().toISOString(),
  })
}

export async function listWorks(): Promise<WorkItem[]> {
  const supabase = getAdminSupabase()
  const { data, error } = await supabase
    .from("works")
    .select("id, title, img, year, public_id, category")
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Failed to load works", error)
    return defaultContent.works
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    img: row.img,
    year: row.year,
    publicId: row.public_id ?? undefined,
    category: row.category ?? "Posters",
  }))
}

