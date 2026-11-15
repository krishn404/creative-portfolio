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
    tag: v.optional(v.string()),
    description: v.optional(v.string()),
    sort_order: v.optional(v.number()),
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

  posts: defineTable({
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(),
    coverImage: v.optional(v.string()),
    tags: v.array(v.string()),
    published: v.boolean(),
    publishedAt: v.optional(v.number()),
    readTime: v.optional(v.string()),
    views: v.number(),
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
    faq: v.optional(v.array(v.object({ q: v.string(), a: v.string() }))),
    tldr: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
    series: v.optional(v.string()),
    previousSlugs: v.optional(v.array(v.string())),
    collaboratorEnabled: v.optional(v.boolean()),
    collaboratorTokenHash: v.optional(v.string()),
    collaboratorCode: v.optional(v.string()),
    collaboratorPasswordHash: v.optional(v.string()),
    collaboratorDraft: v.optional(v.object({
      title: v.string(),
      excerpt: v.string(),
      content: v.string(),
      readTime: v.string(),
      updatedAt: v.number(),
    })),
  })
    .index("by_slug", ["slug"])
    .index("by_collaborator_code", ["collaboratorCode"])
    .index("by_published", ["published"]),

  postRedirects: defineTable({
    fromSlug: v.string(),
    toSlug: v.string(),
  }).index("by_from_slug", ["fromSlug"]),

  postSeoMigrations: defineTable({
    migrationKey: v.string(),
    postId: v.id("posts"),
    beforeJson: v.string(),
    afterJson: v.string(),
    appliedAt: v.number(),
    revertedAt: v.optional(v.number()),
  })
    .index("by_migration", ["migrationKey"])
    .index("by_migration_post", ["migrationKey", "postId"]),

  postViewRecords: defineTable({
    postId: v.id("posts"),
    visitorKey: v.string(),
    lastViewedAt: v.number(),
  })
    .index("by_post_visitor", ["postId", "visitorKey"])
    .index("by_post", ["postId"]),

  subscribers: defineTable({
    email: v.string(),
    source: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("unsubscribed")),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  broadcasts: defineTable({
    subject: v.string(),
    html: v.string(),
    text: v.string(),
    status: v.union(v.literal("sending"), v.literal("completed"), v.literal("failed")),
    createdAt: v.number(),
    sentAt: v.optional(v.number()),
    recipientCount: v.number(),
    sentCount: v.number(),
    failedCount: v.number(),
    nextBatch: v.number(),
    error: v.optional(v.string()),
  }).index("by_createdAt", ["createdAt"]),

  broadcastRecipients: defineTable({
    broadcastId: v.id("broadcasts"),
    subscriberId: v.id("subscribers"),
    email: v.string(),
    status: v.union(v.literal("pending"), v.literal("sending"), v.literal("sent"), v.literal("failed")),
    batchKey: v.optional(v.string()),
    resendId: v.optional(v.string()),
    error: v.optional(v.string()),
    sentAt: v.optional(v.number()),
  })
    .index("by_broadcast_status", ["broadcastId", "status"])
    .index("by_broadcast_subscriber", ["broadcastId", "subscriberId"]),
})
