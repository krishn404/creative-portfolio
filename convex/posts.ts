import { query, mutation, type MutationCtx } from "./_generated/server"
import { v } from "convex/values"
import {
  buildExcerptFromBody,
  buildMetaDescription,
  buildTldr,
  defaultSeries,
} from "./postText"

const faqValidator = v.object({ q: v.string(), a: v.string() })

const seoArgs = {
  seoTitle: v.optional(v.string()),
  metaDescription: v.optional(v.string()),
  keywords: v.optional(v.array(v.string())),
  guestName: v.optional(v.string()),
  ogImageAlt: v.optional(v.string()),
  faq: v.optional(v.array(faqValidator)),
  tldr: v.optional(v.string()),
  series: v.optional(v.string()),
}

function clean(value?: string) {
  const next = value?.trim()
  return next ? next : undefined
}

function cleanFaq(faq?: { q: string; a: string }[]) {
  return (faq ?? [])
    .map((item) => ({ q: item.q.trim(), a: item.a.trim() }))
    .filter((item) => item.q && item.a)
}

function formatPost(post: {
  _id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  tags: string[]
  published: boolean
  publishedAt?: number
  readTime?: string
  views: number
  seoTitle?: string
  metaDescription?: string
  keywords?: string[]
  guestName?: string
  ogImageAlt?: string
  faq?: { q: string; a: string }[]
  tldr?: string
  updatedAt?: number
  series?: string
  previousSlugs?: string[]
}) {
  return {
    id: post._id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage,
    tags: post.tags,
    published: post.published,
    publishedAt: post.publishedAt,
    readTime: post.readTime,
    views: post.views,
    seoTitle: clean(post.seoTitle),
    metaDescription: clean(post.metaDescription),
    keywords: post.keywords ?? [],
    guestName: clean(post.guestName),
    ogImageAlt: clean(post.ogImageAlt),
    faq: cleanFaq(post.faq),
    tldr: clean(post.tldr),
    updatedAt: post.updatedAt,
    series: defaultSeries(post.series),
    previousSlugs: post.previousSlugs ?? [],
  }
}

export const getPublishedPosts = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_published", (q) => q.eq("published", true))
      .collect()

    return posts
      .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
      .map(formatPost)
  },
})

export const getPostBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()

    if (!post || !post.published) return null
    return formatPost(post)
  },
})

export const getRedirectTarget = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const redirect = await ctx.db
      .query("postRedirects")
      .withIndex("by_from_slug", (q) => q.eq("fromSlug", args.slug))
      .first()

    if (!redirect) return null

    const target = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", redirect.toSlug))
      .first()

    if (!target || !target.published) return null
    return target.slug
  },
})

const VIEW_DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000

function getViewSecret() {
  return process.env.BLOG_VIEW_SECRET || process.env.ADMIN_SESSION_TOKEN || "dev-blog-view-secret"
}

export const recordPostView = mutation({
  args: {
    slug: v.string(),
    visitorKey: v.string(),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.secret !== getViewSecret()) {
      return { counted: false, views: null }
    }

    if (!args.visitorKey || args.visitorKey.length < 16) {
      return { counted: false, views: null }
    }

    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()

    if (!post || !post.published) {
      return { counted: false, views: null }
    }

    const now = Date.now()
    const existing = await ctx.db
      .query("postViewRecords")
      .withIndex("by_post_visitor", (q) =>
        q.eq("postId", post._id).eq("visitorKey", args.visitorKey),
      )
      .first()

    if (existing && now - existing.lastViewedAt < VIEW_DEDUP_WINDOW_MS) {
      return { counted: false, views: post.views }
    }

    if (existing) {
      await ctx.db.patch(existing._id, { lastViewedAt: now })
    } else {
      await ctx.db.insert("postViewRecords", {
        postId: post._id,
        visitorKey: args.visitorKey,
        lastViewedAt: now,
      })
    }

    const nextViews = post.views + 1
    await ctx.db.patch(post._id, { views: nextViews })
    return { counted: true, views: nextViews }
  },
})

export const resetAllPostViews = mutation({
  args: { secret: v.string() },
  handler: async (ctx, args) => {
    if (args.secret !== getViewSecret()) {
      throw new Error("Unauthorized")
    }

    const posts = await ctx.db.query("posts").collect()
    for (const post of posts) {
      await ctx.db.patch(post._id, { views: 0 })
    }

    const records = await ctx.db.query("postViewRecords").collect()
    for (const record of records) {
      await ctx.db.delete(record._id)
    }

    return { resetPosts: posts.length, clearedRecords: records.length }
  },
})

export const getAllPostsAdmin = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").collect()
    return posts
      .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
      .map(formatPost)
  },
})

export const getPostById = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id)
    if (!post) return null
    return formatPost(post)
  },
})

export const createPost = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(),
    coverImage: v.optional(v.string()),
    tags: v.array(v.string()),
    published: v.boolean(),
    readTime: v.optional(v.string()),
    ...seoArgs,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()

    if (existing) {
      throw new Error("A post with this slug already exists")
    }

    const excerpt = clean(args.excerpt) || buildExcerptFromBody(args.content, args.title)
    const metaDescription = clean(args.metaDescription) || buildMetaDescription(excerpt, args.title)
    const guestName = clean(args.guestName)
    const now = Date.now()

    const id = await ctx.db.insert("posts", {
      title: args.title,
      slug: args.slug,
      excerpt,
      content: args.content,
      coverImage: args.coverImage,
      tags: args.tags,
      published: args.published,
      publishedAt: args.published ? now : undefined,
      readTime: args.readTime,
      views: 0,
      seoTitle: clean(args.seoTitle),
      metaDescription,
      keywords: args.keywords ?? [],
      guestName,
      ogImageAlt: clean(args.ogImageAlt),
      faq: cleanFaq(args.faq),
      tldr: clean(args.tldr) || buildTldr(args.content, guestName),
      updatedAt: now,
      series: defaultSeries(args.series),
      previousSlugs: [],
    })

    return { id }
  },
})

async function rememberSlug(
  ctx: MutationCtx,
  fromSlug: string,
  toSlug: string,
) {
  if (!fromSlug || fromSlug === toSlug) return

  const redirects = await ctx.db.query("postRedirects").collect()
  const existing = redirects.find((item) => item.fromSlug === fromSlug)
  if (existing) {
    await ctx.db.patch(existing._id, { toSlug })
  } else {
    await ctx.db.insert("postRedirects", { fromSlug, toSlug })
  }

  for (const item of redirects) {
    if (item.toSlug === fromSlug && item.fromSlug !== toSlug) {
      await ctx.db.patch(item._id, { toSlug })
    }
    if (item.fromSlug === toSlug) {
      await ctx.db.delete(item._id)
    }
  }
}

export const updatePost = mutation({
  args: {
    id: v.id("posts"),
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(),
    coverImage: v.optional(v.string()),
    tags: v.array(v.string()),
    published: v.boolean(),
    readTime: v.optional(v.string()),
    ...seoArgs,
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id)
    if (!post) throw new Error("Post not found")

    const slugConflict = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()

    if (slugConflict && slugConflict._id !== args.id) {
      throw new Error("A post with this slug already exists")
    }

    if (post.slug !== args.slug) {
      await rememberSlug(ctx, post.slug, args.slug)
    }

    const wasPublished = post.published
    const now = Date.now()
    const publishedAt =
      args.published && !wasPublished ? now : args.published ? post.publishedAt : undefined

    const excerpt = clean(args.excerpt) || buildExcerptFromBody(args.content, args.title)
    const metaDescription = clean(args.metaDescription) || buildMetaDescription(excerpt, args.title)
    const guestName = clean(args.guestName)
    const previousSlugs = Array.from(new Set([...(post.previousSlugs ?? []), ...(post.slug !== args.slug ? [post.slug] : [])]))

    await ctx.db.patch(args.id, {
      title: args.title,
      slug: args.slug,
      excerpt,
      content: args.content,
      coverImage: args.coverImage,
      tags: args.tags,
      published: args.published,
      publishedAt,
      readTime: args.readTime,
      seoTitle: clean(args.seoTitle),
      metaDescription,
      keywords: args.keywords ?? [],
      guestName,
      ogImageAlt: clean(args.ogImageAlt),
      faq: cleanFaq(args.faq),
      tldr: clean(args.tldr) || buildTldr(args.content, guestName),
      updatedAt: now,
      series: defaultSeries(args.series),
      previousSlugs,
    })

    return { ok: true, previousSlug: post.slug !== args.slug ? post.slug : undefined }
  },
})

export const deletePost = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id)
    if (!post) throw new Error("Post not found")
    const redirects = await ctx.db.query("postRedirects").collect()
    for (const redirect of redirects) {
      if (redirect.toSlug === post.slug || redirect.fromSlug === post.slug) {
        await ctx.db.delete(redirect._id)
      }
    }
    await ctx.db.delete(args.id)
    return { ok: true, slug: post.slug }
  },
})

export const togglePublish = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id)
    if (!post) throw new Error("Post not found")

    const published = !post.published
    await ctx.db.patch(args.id, {
      published,
      publishedAt: published ? Date.now() : undefined,
      updatedAt: Date.now(),
    })

    return { published, slug: post.slug }
  },
})

export const backfillEmptySeo = mutation({
  args: { secret: v.string() },
  handler: async (ctx, args) => {
    if (args.secret !== getViewSecret()) {
      throw new Error("Unauthorized")
    }

    const posts = await ctx.db.query("posts").collect()
    let updated = 0

    for (const post of posts) {
      const excerpt =
        post.excerpt.trim() && post.excerpt.trim() !== post.title.trim()
          ? post.excerpt.trim()
          : buildExcerptFromBody(post.content, post.title)
      const metaDescription = clean(post.metaDescription) || buildMetaDescription(excerpt, post.title)
      const tldr = clean(post.tldr) || buildTldr(post.content, clean(post.guestName))
      const series = defaultSeries(post.series)
      const needsWrite =
        excerpt !== post.excerpt ||
        metaDescription !== post.metaDescription ||
        tldr !== post.tldr ||
        series !== post.series ||
        post.updatedAt === undefined

      if (!needsWrite) continue

      await ctx.db.patch(post._id, {
        excerpt,
        metaDescription,
        tldr,
        series,
        updatedAt: post.updatedAt ?? post.publishedAt ?? Date.now(),
        keywords: post.keywords ?? [],
        faq: post.faq ?? [],
        previousSlugs: post.previousSlugs ?? [],
      })
      updated += 1
    }

    return { updated }
  },
})
