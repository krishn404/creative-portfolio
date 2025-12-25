"use server"

import { cookies } from "next/headers"
import { z } from "zod"
import { v2 as cloudinary } from "cloudinary"
import { ADMIN_COOKIE_NAME } from "@/lib/auth"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import type { SiteContent } from "@/lib/content"

const categories = ["Posters", "Thumbnails", "Graphic Clothing"] as const
const statuses = ["draft", "published", "archived"] as const

const workSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  img: z.string().url(),
  year: z.string().max(10).optional(),
  publicId: z.string().optional(),
  category: z.enum(categories),
  status: z.enum(statuses).optional(),
  media: z
    .array(
      z.object({
        url: z.string().url(),
        publicId: z.string().optional(),
        type: z.enum(["image", "video"]),
        order: z.number(),
      }),
    )
    .optional(),
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

  try {
    await convex.mutation(api.content.upsert, parsed.data)
    return { ok: true }
  } catch (error) {
    console.error("Convex mutation error in saveContentAction:", error)
    throw new Error(
      `Failed to save content: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export async function upsertWorkAction(work: z.infer<typeof workSchema>) {
  await assertAdminSession()
  const parsed = workSchema.safeParse(work)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "))
  }

  try {
    const result = await convex.mutation(api.works.upsert, {
      id: parsed.data.id,
      title: parsed.data.title,
      img: parsed.data.img,
      year: parsed.data.year,
      publicId: parsed.data.publicId,
      category: parsed.data.category,
      status: parsed.data.status || "draft",
      media: parsed.data.media,
    })

    return {
      id: result.id,
      title: parsed.data.title,
      img: parsed.data.img,
      year: parsed.data.year,
      public_id: parsed.data.publicId,
      category: parsed.data.category,
      status: parsed.data.status || "draft",
      media: parsed.data.media,
    }
  } catch (error) {
    console.error("Convex mutation error in upsertWorkAction:", error)
    throw new Error(
      `Failed to save work: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export async function updateWorkStatusAction(workId: string, status: "draft" | "published" | "archived") {
  await assertAdminSession()

  try {
    await convex.mutation(api.works.updateStatus, { id: workId, status })
    return { ok: true }
  } catch (error) {
    console.error("Convex mutation error in updateWorkStatusAction:", error)
    throw new Error(
      `Failed to update work status: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export async function deleteWorkAction(workId: string) {
  await assertAdminSession()

  try {
    const result = await convex.mutation(api.works.deleteWork, { id: workId })

    if (result.publicId) {
      try {
        await cloudinary.uploader.destroy(result.publicId, { invalidate: true })
      } catch (err) {
        console.error("Failed to delete cloudinary asset", err)
      }
    }

    return { ok: true }
  } catch (error) {
    console.error("Convex mutation error in deleteWorkAction:", error)
    throw new Error(
      `Failed to delete work: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export async function validatePasswordAction(password: string) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected || password !== expected) {
    throw new Error("Invalid password")
  }
  return { ok: true }
}
