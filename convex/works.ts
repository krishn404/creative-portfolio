import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

const sortWorks = <T extends { sort_order?: number; created_at: string }>(works: T[]) =>
  [...works].sort((a, b) => {
    if (a.sort_order !== undefined && b.sort_order !== undefined) return a.sort_order - b.sort_order
    if (a.sort_order !== undefined) return -1
    if (b.sort_order !== undefined) return 1
    return b.created_at.localeCompare(a.created_at)
  })

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const works = await ctx.db
      .query("works")
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .collect()

    return sortWorks(works).map((w) => ({
      id: w.id,
      title: w.title,
      img: w.img,
      media: w.media,
      year: w.year,
      tag: w.tag,
      description: w.description,
      sortOrder: w.sort_order,
      publicId: w.public_id,
      category: w.category,
      showInAbout: w.show_in_about,
    }))
  },
})

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const works = await ctx.db.query("works").collect()

    return sortWorks(works).map((w) => ({
      id: w.id,
      title: w.title,
      img: w.img,
      media: w.media,
      year: w.year,
      tag: w.tag,
      description: w.description,
      sortOrder: w.sort_order,
      publicId: w.public_id,
      category: w.category,
      status: w.status,
      showInAbout: w.show_in_about,
    }))
  },
})

export const upsert = mutation({
  args: {
    id: v.optional(v.string()),
    title: v.string(),
    img: v.string(),
    media: v.optional(
      v.array(
        v.object({
          url: v.string(),
          publicId: v.optional(v.string()),
          type: v.union(v.literal("image"), v.literal("video")),
          order: v.number(),
        }),
      ),
    ),
    year: v.optional(v.string()),
    tag: v.optional(v.string()),
    description: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    publicId: v.optional(v.string()),
    category: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
    showInAbout: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    if (args.id) {
      const existing = await ctx.db
        .query("works")
        .filter((q) => q.eq(q.field("id"), args.id))
        .first()

      if (existing) {
        await ctx.db.patch(existing._id, {
          title: args.title,
          img: args.img,
          media: args.media ?? existing.media,
          year: args.year,
          tag: args.tag,
          description: args.description,
          sort_order: args.sortOrder ?? existing.sort_order,
          public_id: args.publicId,
          category: args.category,
          status: args.status ?? existing.status,
          show_in_about: args.showInAbout ?? existing.show_in_about,
          updated_at: now,
        })
        return { id: existing.id }
      }
    }

    const workId = args.id || crypto.randomUUID()
    await ctx.db.insert("works", {
      id: workId,
      title: args.title,
      img: args.img,
      media: args.media ?? [{ url: args.img, publicId: args.publicId, type: "image", order: 0 }],
      year: args.year,
      tag: args.tag,
      description: args.description,
      sort_order: args.sortOrder,
      public_id: args.publicId,
      category: args.category,
      status: args.status ?? "draft",
      show_in_about: args.showInAbout ?? false,
      created_at: now,
      updated_at: now,
    })

    return { id: workId }
  },
})

export const reorder = mutation({
  args: { ids: v.array(v.string()) },
  handler: async (ctx, args) => {
    const works = await ctx.db.query("works").collect()
    const byId = new Map(works.map((work) => [work.id, work]))

    if (args.ids.length !== works.length || new Set(args.ids).size !== args.ids.length || args.ids.some((id) => !byId.has(id))) {
      throw new Error("Order must contain every work exactly once")
    }

    const now = new Date().toISOString()
    await Promise.all(args.ids.map((id, index) => ctx.db.patch(byId.get(id)!._id, { sort_order: index, updated_at: now })))
    return { ok: true }
  },
})

export const updateStatus = mutation({
  args: {
    id: v.string(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("works")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first()

    if (!existing) {
      throw new Error("Work not found")
    }

    await ctx.db.patch(existing._id, {
      status: args.status,
      updated_at: new Date().toISOString(),
    })

    return { ok: true }
  },
})

export const deleteWork = mutation({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("works")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first()

    if (!existing) {
      throw new Error("Work not found")
    }

    await ctx.db.delete(existing._id)

    return { ok: true, publicId: existing.public_id }
  },
})
