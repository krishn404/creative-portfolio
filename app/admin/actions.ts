"use server"

import { cookies } from "next/headers"
import { z } from "zod"
import { v2 as cloudinary } from "cloudinary"
import { ADMIN_COOKIE_NAME, isPasswordValid } from "@/lib/auth"
import { getAdminSupabase } from "@/lib/supabase/admin"
import type { SiteContent } from "@/lib/content"

const categories = ["Posters", "Thumbnails", "Graphic Clothing"] as const

const workSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2),
  img: z.string().url(),
  year: z.string().max(10).optional(),
  publicId: z.string().optional(),
  category: z.enum(categories),
})

const contentSchema = z.object({
  about: z.object({
    headline: z.string().min(2),
    paragraphs: z.array(z.string().min(1)).min(1),
    tags: z.array(z.string().min(1)).min(1),
  }),
  contact: z.object({
    email: z.string().email(),
    cta: z.string().min(4),
    socials: z.array(z.object({ label: z.string().min(1), href: z.string().url() })).min(1),
  }),
  footer: z.object({
    note: z.string().min(2),
  }),
})

async function assertAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  const expected = process.env.ADMIN_SESSION_TOKEN || process.env.ADMIN_PASSWORD
  if (!token || token !== expected) {
    throw new Error("UNAUTHORIZED")
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function saveContentAction(payload: SiteContent) {
  await assertAdminSession()
  const parsed = contentSchema.safeParse({
    about: payload.about,
    contact: payload.contact,
    footer: payload.footer ?? { note: "" },
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "))
  }

  const supabase = getAdminSupabase()
  const { error } = await supabase.from("content").upsert({
    id: "singleton",
    about: parsed.data.about,
    contact: parsed.data.contact,
    footer: parsed.data.footer,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
  return { ok: true }
}

export async function upsertWorkAction(work: z.infer<typeof workSchema>) {
  await assertAdminSession()
  const parsed = workSchema.safeParse(work)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "))
  }

  const supabase = getAdminSupabase()
  const payload = {
    id: parsed.data.id,
    title: parsed.data.title,
    img: parsed.data.img,
    year: parsed.data.year,
    public_id: parsed.data.publicId,
    category: parsed.data.category,
  }

  const { data, error } = await supabase.from("works").upsert(payload).select().single()
  if (error) throw error
  return data
}

export async function deleteWorkAction(workId: string) {
  await assertAdminSession()
  const supabase = getAdminSupabase()

  const { data: existing, error: fetchError } = await supabase
    .from("works")
    .select("public_id")
    .eq("id", workId)
    .single()

  if (fetchError) throw fetchError

  const { error } = await supabase.from("works").delete().eq("id", workId)
  if (error) throw error

  if (existing?.public_id) {
    try {
      await cloudinary.uploader.destroy(existing.public_id, { invalidate: true })
    } catch (err) {
      console.error("Failed to delete cloudinary asset", err)
    }
  }

  return { ok: true }
}

export async function validatePasswordAction(password: string) {
  const valid = isPasswordValid(password)
  if (!valid) {
    throw new Error("Invalid password")
  }
  return { ok: true }
}

