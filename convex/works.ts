import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const works = await ctx.db
      .query("works")
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .collect()

    return works.map((w) => ({
      id: w.id,
      title: w.title,
      img: w.img,
      media: w.media,
      year: w.year,
      publicId: w.public_id,
      category: w.category,
      showInAbout: w.show_in_about,
    }))
  },
})

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const works = await ctx.db.query("works").order("desc").collect()

    return works.map((w) => ({
      id: w.id,
      title: w.title,
      img: w.img,
      media: w.media,
      year: w.year,
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
