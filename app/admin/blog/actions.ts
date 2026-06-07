"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { ADMIN_COOKIE_NAME } from "@/lib/auth"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

async function assertAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  const expected = process.env.ADMIN_SESSION_TOKEN || process.env.ADMIN_PASSWORD
  if (!token || token !== expected) {
    throw new Error("UNAUTHORIZED")
  }
}

export async function createPostAction(data: {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  tags: string[]
  published: boolean
  readTime: string
}) {
  await assertAdminSession()
  const result = await convex.mutation(api.posts.createPost, data)
  revalidatePath("/blog")
  revalidatePath("/admin/blog")
  return result
}

export async function updatePostAction(
  id: string,
  data: {
    title: string
    slug: string
    excerpt: string
    content: string
    coverImage?: string
    tags: string[]
    published: boolean
    readTime: string
  },
) {
  await assertAdminSession()
  await convex.mutation(api.posts.updatePost, {
    id: id as Id<"posts">,
    ...data,
  })
  revalidatePath("/blog")
  revalidatePath(`/blog/${data.slug}`)
  revalidatePath("/admin/blog")
  revalidatePath(`/admin/blog/${id}`)
}

export async function deletePostAction(id: string) {
  await assertAdminSession()
  await convex.mutation(api.posts.deletePost, { id: id as Id<"posts"> })
  revalidatePath("/blog")
  revalidatePath("/admin/blog")
}

export async function togglePublishPostAction(id: string) {
  await assertAdminSession()
  const result = await convex.mutation(api.posts.togglePublish, { id: id as Id<"posts"> })
  revalidatePath("/blog")
  revalidatePath("/admin/blog")
  return result
}
