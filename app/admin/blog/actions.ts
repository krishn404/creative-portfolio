"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { ADMIN_COOKIE_NAME } from "@/lib/auth"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import type { PostWriteInput } from "@/lib/blog/utils"
import { SITE_URL } from "@/lib/seo/constants"
import { tagPath } from "@/lib/blog/seo"

async function refreshBlogPaths(slug?: string, tags: string[] = []) {
  revalidatePath("/")
  revalidatePath("/blog")
  revalidatePath("/sitemap.xml")
  revalidatePath("/about-ktwk")
  revalidatePath("/blog/rss.xml")
  revalidatePath("/blog/tag/[tag]", "page")
  for (const tag of tags) revalidatePath(tagPath(tag))
  if (slug) revalidatePath(`/blog/${slug}`)
}

async function pingIndexNow(url: string) {
  const key = process.env.INDEXNOW_KEY
  if (!key) return
  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: "art.krixnx.xyz", key, keyLocation: `${SITE_URL}/${key}.txt`, urlList: [url] }),
      cache: "no-store",
    })
  } catch (error) { console.error("IndexNow notification failed:", error) }
}

async function assertAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  const expected = process.env.ADMIN_SESSION_TOKEN || process.env.ADMIN_PASSWORD
  if (!token || token !== expected) {
    throw new Error("UNAUTHORIZED")
  }
}

export async function createPostAction(data: PostWriteInput) {
  await assertAdminSession()
  const result = await convex.mutation(api.posts.createPost, data)
  await refreshBlogPaths(data.slug, [...data.tags, ...data.keywords])
  revalidatePath("/admin/blog")
  if (data.published) await pingIndexNow(`${SITE_URL}/blog/${data.slug}`)
  return result
}

export async function updatePostAction(
  id: string,
  data: PostWriteInput,
) {
  await assertAdminSession()
  const result = await convex.mutation(api.posts.updatePost, {
    id: id as Id<"posts">,
    ...data,
  })
  await refreshBlogPaths(data.slug, [...data.tags, ...data.keywords])
  if (result.previousSlug) revalidatePath(`/blog/${result.previousSlug}`)
  revalidatePath("/admin/blog")
  revalidatePath(`/admin/blog/${id}`)
  if (data.published) await pingIndexNow(`${SITE_URL}/blog/${data.slug}`)
}

export async function deletePostAction(id: string) {
  await assertAdminSession()
  const result = await convex.mutation(api.posts.deletePost, { id: id as Id<"posts"> })
  await refreshBlogPaths(result.slug)
  revalidatePath("/admin/blog")
}

export async function resetAllPostViewsAction() {
  await assertAdminSession()
  const secret = process.env.BLOG_VIEW_SECRET || process.env.ADMIN_SESSION_TOKEN || "dev-blog-view-secret"
  const result = await convex.mutation(api.posts.resetAllPostViews, { secret })
  revalidatePath("/blog")
  revalidatePath("/blog/[slug]", "page")
  revalidatePath("/admin/blog")
  return result
}

export async function togglePublishPostAction(id: string) {
  await assertAdminSession()
  const result = await convex.mutation(api.posts.togglePublish, { id: id as Id<"posts"> })
  await refreshBlogPaths(result.slug)
  revalidatePath("/admin/blog")
  if (result.published) await pingIndexNow(`${SITE_URL}/blog/${result.slug}`)
  return result
}
