import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

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

export const incrementPostViews = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()

    if (!post || !post.published) return null

    await ctx.db.patch(post._id, { views: post.views + 1 })
    return { views: post.views + 1 }
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()

    if (existing) {
      throw new Error("A post with this slug already exists")
    }

    const id = await ctx.db.insert("posts", {
      title: args.title,
      slug: args.slug,
      excerpt: args.excerpt,
      content: args.content,
      coverImage: args.coverImage,
      tags: args.tags,
      published: args.published,
      publishedAt: args.published ? Date.now() : undefined,
      readTime: args.readTime,
      views: 0,
    })

    return { id }
  },
})

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

    const wasPublished = post.published
    const publishedAt =
      args.published && !wasPublished
        ? Date.now()
        : args.published
          ? post.publishedAt
          : undefined

    await ctx.db.patch(args.id, {
      title: args.title,
      slug: args.slug,
      excerpt: args.excerpt,
      content: args.content,
      coverImage: args.coverImage,
      tags: args.tags,
      published: args.published,
      publishedAt,
      readTime: args.readTime,
    })

    return { ok: true }
  },
})

export const deletePost = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id)
    if (!post) throw new Error("Post not found")
    await ctx.db.delete(args.id)
    return { ok: true }
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
    })

    return { published }
  },
})
