import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  content: defineTable({
    id: v.string(),

    about: v.object({
      headline: v.string(),
      paragraphs: v.array(v.string()),
      tags: v.array(v.string()),
    }),

    contact: v.object({
      email: v.string(),
      cta: v.string(),
      socials: v.array(
        v.object({
          label: v.string(),
          href: v.string(),
        }),
      ),
    }),

    footer: v.optional(
      v.object({
        note: v.string(),
      }),
    ),

    updated_at: v.string(),
  }).index("by_content_id", ["id"]),

  works: defineTable({
    id: v.string(),
    title: v.string(),

    media: v.array(
      v.object({
        url: v.string(),
        publicId: v.optional(v.string()),
        type: v.union(v.literal("image"), v.literal("video")),
        order: v.number(),
      }),
    ),

    img: v.string(),
    year: v.optional(v.string()),
    public_id: v.optional(v.string()),
    category: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),

    //  NEW FIELD (for "Show in About Section" checkbox)
    show_in_about: v.optional(v.boolean()),

    created_at: v.string(),
    updated_at: v.string(),
  })
    .index("by_work_id", ["id"])
    .index("by_status", ["status"])
    .index("by_created", ["created_at"]),
})
