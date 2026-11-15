import { query, mutation, type MutationCtx } from "./_generated/server"
import type { Doc } from "./_generated/dataModel"
import { v } from "convex/values"
import {
  buildExcerptFromBody,
  buildMetaDescription,
  buildTldr,
  defaultSeries,
  inferArticleType,
  type ArticleType,
} from "./postText"

const faqValidator = v.object({ q: v.string(), a: v.string() })

const seoArgs = {
  seoTitle: v.optional(v.string()),
  metaDescription: v.optional(v.string()),
  keywords: v.optional(v.array(v.string())),
  articleType: v.optional(
    v.union(v.literal("interview"), v.literal("review"), v.literal("article")),
  ),
  guestName: v.optional(v.string()),
  subjectAliases: v.optional(v.array(v.string())),
  subjectSameAs: v.optional(v.array(v.string())),
  ogImageAlt: v.optional(v.string()),
  faq: v.optional(v.array(faqValidator)),
  tldr: v.optional(v.string()),
  series: v.optional(v.string()),
}

function clean(value?: string) {
  const next = value?.trim()
  return next ? next : undefined
}

function cleanTags(tags: string[]) {
  return Array.from(new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)))
}

function cleanList(values?: string[]) {
  return Array.from(new Set((values ?? []).map((value) => value.trim()).filter(Boolean)))
}

function cleanSameAs(values?: string[]) {
  return cleanList(values).map((value) => {
    let url: URL
    try {
      url = new URL(value)
    } catch {
      throw new Error(`Invalid verified identity URL: ${value}`)
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error(`Verified identity URL must use HTTP or HTTPS: ${value}`)
    }
    return url.toString()
  })
}

function cleanFaq(faq?: { q: string; a: string }[]) {
  return (faq ?? [])
    .map((item) => ({ q: item.q.trim(), a: item.a.trim() }))
    .filter((item) => item.q && item.a)
}

function formatPost(post: Doc<"posts">) {
  const articleType = inferArticleType(post)
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
    articleType,
    guestName: clean(post.guestName),
    subjectAliases: cleanList(post.subjectAliases),
    subjectSameAs: cleanList(post.subjectSameAs),
    ogImageAlt: clean(post.ogImageAlt),
    faq: cleanFaq(post.faq),
    tldr: clean(post.tldr),
    updatedAt: post.updatedAt,
    series: defaultSeries(post.series),
    previousSlugs: post.previousSlugs ?? [],
    collaboratorEnabled: post.collaboratorEnabled ?? false,
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
    return { ...formatPost(post), collaboratorDraft: post.collaboratorDraft }
  },
})

export const getCollaboratorPost = query({
  args: { slug: v.string(), code: v.string(), passwordHash: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()

    if (
      !post ||
      !post.collaboratorEnabled ||
      post.collaboratorCode !== args.code ||
      post.collaboratorPasswordHash !== args.passwordHash
    ) return null

    const source = post.collaboratorDraft ?? post
    return {
      id: post._id,
      title: source.title,
      slug: post.slug,
      excerpt: source.excerpt,
      content: source.content,
      published: post.published,
    }
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
    const guestName = clean(args.guestName)
    const articleType = inferArticleType({ ...args, guestName })
    const now = Date.now()

    const id = await ctx.db.insert("posts", {
      title: args.title,
      slug: args.slug,
      excerpt,
      content: args.content,
      coverImage: args.coverImage,
      tags: cleanTags(args.tags),
      published: args.published,
      publishedAt: args.published ? now : undefined,
      readTime: args.readTime,
      views: 0,
      seoTitle: clean(args.seoTitle),
      metaDescription: clean(args.metaDescription),
      keywords: cleanList(args.keywords),
      articleType,
      guestName,
      subjectAliases: cleanList(args.subjectAliases),
      subjectSameAs: cleanSameAs(args.subjectSameAs),
      ogImageAlt: clean(args.ogImageAlt),
      faq: cleanFaq(args.faq),
      tldr: clean(args.tldr),
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

    const now = Date.now()
    const publishedAt = args.published && !post.publishedAt ? now : post.publishedAt

    const excerpt = clean(args.excerpt) || buildExcerptFromBody(args.content, args.title)
    const guestName = clean(args.guestName)
    const articleType = inferArticleType({ ...args, guestName })
    const previousSlugs = Array.from(new Set([...(post.previousSlugs ?? []), ...(post.slug !== args.slug ? [post.slug] : [])]))
    const next = {
      title: args.title,
      slug: args.slug,
      excerpt,
      content: args.content,
      coverImage: args.coverImage,
      tags: cleanTags(args.tags),
      published: args.published,
      publishedAt,
      readTime: args.readTime,
      seoTitle: clean(args.seoTitle),
      metaDescription: clean(args.metaDescription),
      keywords: cleanList(args.keywords),
      articleType,
      guestName,
      subjectAliases: cleanList(args.subjectAliases),
      subjectSameAs: cleanSameAs(args.subjectSameAs),
      ogImageAlt: clean(args.ogImageAlt),
      faq: cleanFaq(args.faq),
      tldr: clean(args.tldr),
      series: defaultSeries(args.series),
      previousSlugs,
    }

    const comparableKeys = Object.keys(next) as (keyof typeof next)[]
    const changed = comparableKeys.some((key) => JSON.stringify(post[key]) !== JSON.stringify(next[key]))
    if (changed) await ctx.db.patch(args.id, { ...next, updatedAt: now })

    return {
      ok: true,
      changed,
      previousSlug: post.slug !== args.slug ? post.slug : undefined,
      previousTags: post.tags,
      previousKeywords: post.keywords ?? [],
    }
  },
})

export const setCollaboratorAccess = mutation({
  args: {
    id: v.id("posts"),
    enabled: v.boolean(),
    code: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.secret !== getViewSecret()) throw new Error("Unauthorized")
    const post = await ctx.db.get(args.id)
    if (!post) throw new Error("Post not found")
    if (args.enabled && (!args.code || !args.passwordHash)) throw new Error("Collaborator code and password are required")
    if (args.enabled) {
      const duplicate = await ctx.db
        .query("posts")
        .withIndex("by_collaborator_code", (q) => q.eq("collaboratorCode", args.code))
        .first()
      if (duplicate && duplicate._id !== args.id) throw new Error("Collaborator code already exists")
    }

    await ctx.db.patch(args.id, {
      collaboratorEnabled: args.enabled,
      collaboratorTokenHash: undefined,
      collaboratorCode: args.enabled ? args.code : undefined,
      collaboratorPasswordHash: args.enabled ? args.passwordHash : undefined,
      updatedAt: Date.now(),
    })
    return { slug: post.slug, enabled: args.enabled }
  },
})

export const updateCollaboratorPost = mutation({
  args: {
    slug: v.string(),
    code: v.string(),
    passwordHash: v.string(),
    title: v.string(),
    excerpt: v.string(),
    content: v.string(),
    readTime: v.string(),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.secret !== getViewSecret()) throw new Error("Unauthorized")
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()

    if (
      !post ||
      !post.collaboratorEnabled ||
      post.collaboratorCode !== args.code ||
      post.collaboratorPasswordHash !== args.passwordHash
    ) {
      throw new Error("Collaborator access is invalid or has been disabled")
    }

    const title = args.title.trim()
    const content = args.content.trim()
    if (!title || !content) throw new Error("Title and content are required")

    const excerpt = clean(args.excerpt) || buildExcerptFromBody(content, title)
    await ctx.db.patch(post._id, {
      collaboratorDraft: { title, excerpt, content, readTime: args.readTime, updatedAt: Date.now() },
    })

    return { slug: post.slug, published: post.published }
  },
})

export const applyCollaboratorDraft = mutation({
  args: { id: v.id("posts"), secret: v.string() },
  handler: async (ctx, args) => {
    if (args.secret !== getViewSecret()) throw new Error("Unauthorized")
    const post = await ctx.db.get(args.id)
    if (!post) throw new Error("Post not found")
    if (!post.collaboratorDraft) throw new Error("No collaborator draft to apply")

    await ctx.db.patch(args.id, {
      title: post.collaboratorDraft.title,
      excerpt: post.collaboratorDraft.excerpt,
      content: post.collaboratorDraft.content,
      readTime: post.collaboratorDraft.readTime,
      collaboratorDraft: undefined,
      updatedAt: Date.now(),
    })
    return { slug: post.slug, tags: post.tags, keywords: post.keywords ?? [] }
  },
})

export const discardCollaboratorDraft = mutation({
  args: { id: v.id("posts"), secret: v.string() },
  handler: async (ctx, args) => {
    if (args.secret !== getViewSecret()) throw new Error("Unauthorized")
    const post = await ctx.db.get(args.id)
    if (!post) throw new Error("Post not found")
    await ctx.db.patch(args.id, { collaboratorDraft: undefined, updatedAt: Date.now() })
    return { slug: post.slug }
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
    return { ok: true, slug: post.slug, tags: post.tags, keywords: post.keywords ?? [] }
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
      publishedAt: published && !post.publishedAt ? Date.now() : post.publishedAt,
      updatedAt: Date.now(),
    })

    return { published, slug: post.slug, tags: post.tags, keywords: post.keywords ?? [] }
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
      const articleType = inferArticleType(post)
      const tldr = clean(post.tldr) || buildTldr(post.content, clean(post.guestName), articleType)
      const series = defaultSeries(post.series)
      const needsWrite =
        excerpt !== post.excerpt ||
        metaDescription !== post.metaDescription ||
        tldr !== post.tldr ||
        articleType !== post.articleType ||
        series !== post.series ||
        post.updatedAt === undefined

      if (!needsWrite) continue

      await ctx.db.patch(post._id, {
        excerpt,
        metaDescription,
        tldr,
        articleType,
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

const KTWK_SEO_MIGRATION = "ktwk-seo-v2-2026-11-09"

type SeoMigrationState = {
  articleType: ArticleType | null
  guestName: string | null
  subjectAliases: string[]
  subjectSameAs: string[]
  seoTitle: string | null
  metaDescription: string | null
  content: string
  updatedAt: number | null
}

type SeoBackfillSpec = {
  articleType: ArticleType
  guestName: string
  subjectAliases?: string[]
  seoTitle?: string
  metaDescription?: string
  imageAlts?: Record<string, string>
}

const KTWK_SEO_BACKFILL: Record<string, SeoBackfillSpec> = {
  "arsu-bhai": {
    articleType: "interview",
    guestName: "Arsu Bhai",
    subjectAliases: ["Arsalaan"],
  },
  bharg: { articleType: "interview", guestName: "Bharg Kale" },
  bluk: {
    articleType: "interview",
    guestName: "BLUK",
    imageAlts: {
      lc6oqfxqohg2c2afauaq: "A producer performing onstage under red lighting with a vocalist beside him",
      iwquyjxtib2leudtnwpr: "Two friends standing together on a sunny beach",
    },
  },
  krameri: { articleType: "interview", guestName: "Krameri" },
  hadi: {
    articleType: "interview",
    guestName: "Hadi",
    imageAlts: {
      kebagewy86pcci4xlud1: "Orange-and-black close-up portrait artwork for RAWBONED",
      vunemj3qmlda5ygmukbw: "A silhouetted person standing beneath dense tree branches in amber light",
      qstgvvkebtoyvctxoksf: "A performer in a red shirt surrounded by dancers wearing animal masks on a dark street",
    },
  },
  "vidhu-kota": {
    articleType: "interview",
    guestName: "Vidhu Kota",
    seoTitle: "Vidhu Kota Interview: Montage and Handmade Music Videos",
    metaDescription: "Vidhu Kota joins KTWK — Kezual Talks with Kant to discuss Montage, film school in New York, handmade music videos, small budgets, crew credits and Call Sheet.",
    imageAlts: {
      nwfpg3z6svzfzjcqk5fu: "A filmmaker seated beside a cinema camera mounted on a tripod",
      exiprtjeo7mfbn9febj2: "A filmmaker holding a camera while directing two performers on a set framed like a postcard",
    },
  },
  rohh: {
    articleType: "interview",
    guestName: "Rohh",
    imageAlts: {
      o0gppw4qdfypfq2uimhb: "Three musicians smiling around a laptop and microphone in a recording studio",
      net9laqprrvacmddprlp: "Two men standing on a beach at dusk",
    },
  },
  "renaissance-album-review-by-Kayze": {
    articleType: "review",
    guestName: "Kayze",
  },
}

function seoMigrationState(post: Doc<"posts">): SeoMigrationState {
  return {
    articleType: post.articleType ?? null,
    guestName: clean(post.guestName) ?? null,
    subjectAliases: cleanList(post.subjectAliases),
    subjectSameAs: cleanList(post.subjectSameAs),
    seoTitle: clean(post.seoTitle) ?? null,
    metaDescription: clean(post.metaDescription) ?? null,
    content: post.content,
    updatedAt: post.updatedAt ?? null,
  }
}

function seoMigrationPatch(state: SeoMigrationState) {
  return {
    articleType: state.articleType ?? undefined,
    guestName: state.guestName ?? undefined,
    subjectAliases: state.subjectAliases,
    subjectSameAs: state.subjectSameAs,
    seoTitle: state.seoTitle ?? undefined,
    metaDescription: state.metaDescription ?? undefined,
    content: state.content,
    updatedAt: state.updatedAt ?? undefined,
  }
}

function addInlineImageAlts(content: string, replacements: Record<string, string> = {}) {
  if (!Object.keys(replacements).length) return content
  try {
    const doc = JSON.parse(content) as unknown
    const visit = (value: unknown) => {
      if (!value || typeof value !== "object") return
      const node = value as { type?: string; attrs?: Record<string, unknown>; content?: unknown[] }
      if (node.type === "image" && node.attrs && typeof node.attrs.src === "string") {
        const replacement = Object.entries(replacements).find(([id]) => node.attrs?.src?.toString().includes(id))
        if (replacement && (typeof node.attrs.alt !== "string" || !node.attrs.alt.trim())) {
          node.attrs.alt = replacement[1]
        }
      }
      node.content?.forEach(visit)
    }
    visit(doc)
    return JSON.stringify(doc)
  } catch {
    return content
  }
}

function desiredSeoMigrationState(post: Doc<"posts">, spec: SeoBackfillSpec, now: number): SeoMigrationState {
  const before = seoMigrationState(post)
  return {
    ...before,
    articleType: spec.articleType,
    guestName: spec.guestName,
    subjectAliases: cleanList(spec.subjectAliases),
    seoTitle: spec.seoTitle ?? before.seoTitle,
    metaDescription: spec.metaDescription ?? before.metaDescription,
    content: addInlineImageAlts(before.content, spec.imageAlts),
    updatedAt: now,
  }
}

export const applyKtwkSeoBackfill = mutation({
  args: { secret: v.string() },
  handler: async (ctx, args) => {
    if (args.secret !== getViewSecret()) throw new Error("Unauthorized")

    const result = { updated: [] as string[], unchanged: [] as string[], conflicts: [] as string[], missing: [] as string[] }
    for (const [slug, spec] of Object.entries(KTWK_SEO_BACKFILL)) {
      const post = await ctx.db.query("posts").withIndex("by_slug", (q) => q.eq("slug", slug)).first()
      if (!post) {
        result.missing.push(slug)
        continue
      }

      const snapshot = await ctx.db
        .query("postSeoMigrations")
        .withIndex("by_migration_post", (q) => q.eq("migrationKey", KTWK_SEO_MIGRATION).eq("postId", post._id))
        .first()
      const currentJson = JSON.stringify(seoMigrationState(post))
      if (snapshot && !snapshot.revertedAt) {
        if (currentJson === snapshot.afterJson) result.unchanged.push(slug)
        else result.conflicts.push(slug)
        continue
      }
      if (snapshot && currentJson !== snapshot.beforeJson) {
        result.conflicts.push(slug)
        continue
      }

      const now = Date.now()
      const beforeJson = snapshot?.beforeJson ?? currentJson
      const after = desiredSeoMigrationState(post, spec, now)
      const afterJson = JSON.stringify(after)
      await ctx.db.patch(post._id, seoMigrationPatch(after))
      if (snapshot) {
        await ctx.db.patch(snapshot._id, { afterJson, appliedAt: now, revertedAt: undefined })
      } else {
        await ctx.db.insert("postSeoMigrations", {
          migrationKey: KTWK_SEO_MIGRATION,
          postId: post._id,
          beforeJson,
          afterJson,
          appliedAt: now,
        })
      }
      result.updated.push(slug)
    }
    return result
  },
})

export const revertKtwkSeoBackfill = mutation({
  args: { secret: v.string() },
  handler: async (ctx, args) => {
    if (args.secret !== getViewSecret()) throw new Error("Unauthorized")
    const snapshots = await ctx.db
      .query("postSeoMigrations")
      .withIndex("by_migration", (q) => q.eq("migrationKey", KTWK_SEO_MIGRATION))
      .collect()
    const result = { reverted: [] as string[], unchanged: [] as string[], conflicts: [] as string[], missing: 0 }

    for (const snapshot of snapshots) {
      const post = await ctx.db.get(snapshot.postId)
      if (!post) {
        result.missing += 1
        continue
      }
      const currentJson = JSON.stringify(seoMigrationState(post))
      if (currentJson === snapshot.beforeJson) {
        result.unchanged.push(post.slug)
        continue
      }
      if (currentJson !== snapshot.afterJson) {
        result.conflicts.push(post.slug)
        continue
      }
      const before = JSON.parse(snapshot.beforeJson) as SeoMigrationState
      await ctx.db.patch(post._id, seoMigrationPatch(before))
      await ctx.db.patch(snapshot._id, { revertedAt: Date.now() })
      result.reverted.push(post.slug)
    }
    return result
  },
})
