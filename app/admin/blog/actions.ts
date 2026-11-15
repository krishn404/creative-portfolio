"use server"

import { cookies } from "next/headers"
import { createHash, randomBytes } from "node:crypto"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ADMIN_COOKIE_NAME, getAdminSessionToken } from "@/lib/auth"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import type { PostWriteInput } from "@/lib/blog/utils"
import { SITE_URL } from "@/lib/seo/constants"
import { tagPath } from "@/lib/blog/seo"
import { saveErrorMessage } from "@/lib/blog/save-error.mjs"
import { computeReadTime } from "@/lib/blog/utils"

type SavePostResult = { ok: true; id?: string } | { ok: false; message: string }

const collaboratorEditSchema = z.object({
  slug: z.string().min(1),
  token: z.string().min(32).max(200),
  title: z.string().trim().min(1).max(240),
  excerpt: z.string().max(2_000),
  content: z.string().min(1).max(200_000),
})

function collaboratorTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

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
  // The admin password is used only to log in; the cookie stores the session token.
  const expected = getAdminSessionToken()
  if (!token || token !== expected) {
    throw new Error("UNAUTHORIZED")
  }
}

export async function createPostAction(data: PostWriteInput): Promise<SavePostResult> {
  let result: { id: Id<"posts"> }
  try {
    await assertAdminSession()
    result = await convex.mutation(api.posts.createPost, data)
  } catch (error) {
    console.error("Failed to create blog post:", error)
    return { ok: false, message: saveErrorMessage(error) }
  }

  try {
    await refreshBlogPaths(data.slug, [...data.tags, ...data.keywords])
    revalidatePath("/admin/blog")
  } catch (error) {
    // The post is already saved. A cache refresh failure should not make the
    // editor report that the write failed or invite a duplicate retry.
    console.error("Blog post was created, but cache refresh failed:", error)
  }
  if (data.published) await pingIndexNow(`${SITE_URL}/blog/${data.slug}`)
  return { ok: true, id: result.id }
}

export async function updatePostAction(
  id: string,
  data: PostWriteInput,
) : Promise<SavePostResult> {
  let result: { ok: boolean; changed: boolean; previousSlug?: string; previousTags: string[]; previousKeywords: string[] }
  try {
    await assertAdminSession()
    result = await convex.mutation(api.posts.updatePost, {
      id: id as Id<"posts">,
      ...data,
    })
  } catch (error) {
    console.error("Failed to update blog post:", error)
    return { ok: false, message: saveErrorMessage(error) }
  }

  try {
    await refreshBlogPaths(data.slug, [...data.tags, ...data.keywords, ...result.previousTags, ...result.previousKeywords])
    if (result.previousSlug) revalidatePath(`/blog/${result.previousSlug}`)
    revalidatePath("/admin/blog")
    revalidatePath(`/admin/blog/${id}`)
  } catch (error) {
    console.error("Blog post was updated, but cache refresh failed:", error)
  }
  if (data.published) await pingIndexNow(`${SITE_URL}/blog/${data.slug}`)
  return { ok: true }
}

export async function setPostCollaboratorAccessAction(id: string, enabled: boolean) {
  try {
    await assertAdminSession()
    const token = enabled ? randomBytes(32).toString("base64url") : undefined
    const result = await convex.mutation(api.posts.setCollaboratorAccess, {
      id: id as Id<"posts">,
      enabled,
      tokenHash: token ? collaboratorTokenHash(token) : undefined,
      secret: blogMutationSecret(),
    })

    revalidatePath(`/admin/blog/${id}`)
    return {
      ok: true as const,
      enabled: result.enabled,
      path: token ? `/blog/${result.slug}/edit/${token}` : undefined,
    }
  } catch (error) {
    console.error("Failed to update collaborator access:", error)
    return { ok: false as const, message: "Could not update contributor access. Please try again." }
  }
}

export async function updateCollaboratorPostAction(input: z.infer<typeof collaboratorEditSchema>): Promise<SavePostResult> {
  const parsed = collaboratorEditSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Please provide a valid collaborator link, title, and article content." }

  try {
    const result = await convex.mutation(api.posts.updateCollaboratorPost, {
      slug: parsed.data.slug,
      tokenHash: collaboratorTokenHash(parsed.data.token),
      title: parsed.data.title,
      excerpt: parsed.data.excerpt,
      content: parsed.data.content,
      readTime: computeReadTime(parsed.data.content),
      secret: blogMutationSecret(),
    })
    return { ok: true }
  } catch (error) {
    console.error("Failed to save collaborator edit:", error)
    return { ok: false, message: "This collaborator link is invalid or no longer active." }
  }
}

export async function applyCollaboratorDraftAction(id: string) {
  await assertAdminSession()
  const result = await convex.mutation(api.posts.applyCollaboratorDraft, {
    id: id as Id<"posts">,
    secret: blogMutationSecret(),
  })
  await refreshBlogPaths(result.slug, [...result.tags, ...result.keywords])
  revalidatePath(`/admin/blog/${id}`)
  return { ok: true }
}

export async function discardCollaboratorDraftAction(id: string) {
  await assertAdminSession()
  await convex.mutation(api.posts.discardCollaboratorDraft, {
    id: id as Id<"posts">,
    secret: blogMutationSecret(),
  })
  revalidatePath(`/admin/blog/${id}`)
  return { ok: true }
}

export async function deletePostAction(id: string) {
  await assertAdminSession()
  const result = await convex.mutation(api.posts.deletePost, { id: id as Id<"posts"> })
  await refreshBlogPaths(result.slug, [...result.tags, ...result.keywords])
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
  await refreshBlogPaths(result.slug, [...result.tags, ...result.keywords])
  revalidatePath("/admin/blog")
  if (result.published) await pingIndexNow(`${SITE_URL}/blog/${result.slug}`)
  return result
}

function blogMutationSecret() {
  return process.env.BLOG_VIEW_SECRET || process.env.ADMIN_SESSION_TOKEN || "dev-blog-view-secret"
}

export async function applyKtwkSeoBackfillAction() {
  await assertAdminSession()
  const result = await convex.mutation(api.posts.applyKtwkSeoBackfill, { secret: blogMutationSecret() })
  await refreshBlogPaths()
  revalidatePath("/blog/[slug]", "page")
  revalidatePath("/admin/blog")
  return result
}

export async function revertKtwkSeoBackfillAction() {
  await assertAdminSession()
  const result = await convex.mutation(api.posts.revertKtwkSeoBackfill, { secret: blogMutationSecret() })
  await refreshBlogPaths()
  revalidatePath("/blog/[slug]", "page")
  revalidatePath("/admin/blog")
  return result
}
