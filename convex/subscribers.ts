import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function assertAdminToken(token: string) {
  const expected = process.env.ADMIN_SESSION_TOKEN
  if (!expected || token !== expected) throw new Error("UNAUTHORIZED")
}

/**
 * A public mutation deliberately returning the same response for both new and
 * existing addresses, so it cannot be used to enumerate the subscriber list.
 */
export const subscribe = mutation({
  args: {
    email: v.string(),
    source: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Hidden field. Bots get a successful-looking response but no write.
    if (args.website?.trim()) return { ok: true }

    const email = normalizeEmail(args.email)
    if (!emailPattern.test(email) || email.length > 320) {
      throw new Error("INVALID_EMAIL")
    }

    const source = args.source?.trim().slice(0, 80) || undefined
    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique()

    if (existing) {
      if (existing.status === "unsubscribed") {
        await ctx.db.patch(existing._id, { status: "active", source })
      }
      return { ok: true }
    }

    await ctx.db.insert("subscribers", {
      email,
      source,
      status: "active",
      createdAt: Date.now(),
    })

    return { ok: true }
  },
})

export const unsubscribe = mutation({
  args: { id: v.id("subscribers") },
  handler: async (ctx, args) => {
    const subscriber = await ctx.db.get(args.id)
    if (!subscriber) return { ok: false }

    if (subscriber.status !== "unsubscribed") {
      await ctx.db.patch(subscriber._id, { status: "unsubscribed" })
    }

    return { ok: true }
  },
})

export const getAdminOverview = query({
  args: { adminToken: v.string(), search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    assertAdminToken(args.adminToken)
    const search = args.search?.trim().toLowerCase() ?? ""
    const subscribers = await ctx.db.query("subscribers").collect()
    const visibleSubscribers = subscribers
      .filter((subscriber) => !search || subscriber.email.includes(search) || subscriber.source?.toLowerCase().includes(search))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 250)

    const activeSubscribers = subscribers.filter((subscriber) => subscriber.status === "active")
    const sources = activeSubscribers.reduce<Record<string, number>>((counts, subscriber) => {
      const source = subscriber.source || "Direct"
      counts[source] = (counts[source] ?? 0) + 1
      return counts
    }, {})
    const broadcasts = await ctx.db.query("broadcasts").withIndex("by_createdAt").order("desc").take(20)

    return {
      activeCount: activeSubscribers.length,
      sources: Object.entries(sources).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
      subscribers: visibleSubscribers.map((subscriber) => ({
        id: subscriber._id,
        email: subscriber.email,
        source: subscriber.source,
        status: subscriber.status,
        createdAt: subscriber.createdAt,
      })),
      broadcasts,
    }
  },
})

export const exportActive = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    assertAdminToken(args.adminToken)
    const subscribers = await ctx.db.query("subscribers").collect()
    return subscribers
      .filter((subscriber) => subscriber.status === "active")
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((subscriber) => ({ email: subscriber.email, source: subscriber.source, createdAt: subscriber.createdAt }))
  },
})

export const removeSubscriber = mutation({
  args: { adminToken: v.string(), id: v.id("subscribers") },
  handler: async (ctx, args) => {
    assertAdminToken(args.adminToken)
    const subscriber = await ctx.db.get(args.id)
    if (!subscriber) return { ok: false }
    if (subscriber.status !== "unsubscribed") {
      await ctx.db.patch(subscriber._id, { status: "unsubscribed" })
    }
    return { ok: true }
  },
})
