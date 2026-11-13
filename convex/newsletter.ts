import { internalMutation, internalQuery, mutation } from "./_generated/server"
import { v } from "convex/values"
import { buildNewsletterContent } from "./newsletterTemplate"

function assertAdminToken(token: string) {
  const expected = process.env.ADMIN_SESSION_TOKEN
  if (!expected || token !== expected) throw new Error("UNAUTHORIZED")
}

const broadcastArgs = {
  subject: v.string(),
  workUpdate: v.string(),
  affirmation: v.string(),
}

export const createBroadcast = mutation({
  args: { adminToken: v.string(), ...broadcastArgs },
  handler: async (ctx, args) => {
    assertAdminToken(args.adminToken)
    const subject = args.subject.trim()
    const workUpdate = args.workUpdate.trim()
    const affirmation = args.affirmation.trim()
    if (!subject || !workUpdate || !affirmation) throw new Error("INVALID_BROADCAST")
    const content = buildNewsletterContent(subject, workUpdate, affirmation)
    return await ctx.db.insert("broadcasts", {
      subject,
      html: content.html,
      text: content.text,
      status: "sending",
      createdAt: Date.now(),
      recipientCount: 0,
      sentCount: 0,
      failedCount: 0,
      nextBatch: 0,
    })
  },
})

export const getBroadcast = internalQuery({
  args: { id: v.id("broadcasts") },
  handler: (ctx, args) => ctx.db.get(args.id),
})

export const getActiveSubscribers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const subscribers = await ctx.db.query("subscribers").collect()
    return subscribers.filter((subscriber) => subscriber.status === "active").map((subscriber) => ({ id: subscriber._id, email: subscriber.email }))
  },
})

export const seedRecipients = internalMutation({
  args: { broadcastId: v.id("broadcasts"), subscribers: v.array(v.object({ id: v.id("subscribers"), email: v.string() })) },
  handler: async (ctx, args) => {
    let inserted = 0
    for (const subscriber of args.subscribers) {
      const existing = await ctx.db.query("broadcastRecipients").withIndex("by_broadcast_subscriber", (q) => q.eq("broadcastId", args.broadcastId).eq("subscriberId", subscriber.id)).unique()
      if (!existing) {
        await ctx.db.insert("broadcastRecipients", { broadcastId: args.broadcastId, subscriberId: subscriber.id, email: subscriber.email, status: "pending" })
        inserted += 1
      }
    }
    const broadcast = await ctx.db.get(args.broadcastId)
    if (broadcast) await ctx.db.patch(args.broadcastId, { recipientCount: broadcast.recipientCount + inserted })
  },
})

export const claimNextBatch = internalMutation({
  args: { broadcastId: v.id("broadcasts") },
  handler: async (ctx, args) => {
    const sending = await ctx.db.query("broadcastRecipients").withIndex("by_broadcast_status", (q) => q.eq("broadcastId", args.broadcastId).eq("status", "sending")).take(100)
    if (sending.length) return { recipients: sending, batchKey: sending[0].batchKey ?? `${args.broadcastId}-recovery` }

    const pending = await ctx.db.query("broadcastRecipients").withIndex("by_broadcast_status", (q) => q.eq("broadcastId", args.broadcastId).eq("status", "pending")).take(100)
    if (!pending.length) return { recipients: [], batchKey: "" }
    const broadcast = await ctx.db.get(args.broadcastId)
    if (!broadcast) throw new Error("BROADCAST_NOT_FOUND")
    const batchKey = `${args.broadcastId}-${broadcast.nextBatch}`
    for (const recipient of pending) await ctx.db.patch(recipient._id, { status: "sending", batchKey })
    await ctx.db.patch(args.broadcastId, { nextBatch: broadcast.nextBatch + 1 })
    return { recipients: pending.map((recipient) => ({ ...recipient, status: "sending" as const, batchKey })), batchKey }
  },
})

export const markBatch = internalMutation({
  args: {
    broadcastId: v.id("broadcasts"),
    recipients: v.array(v.object({ id: v.id("broadcastRecipients"), resendId: v.optional(v.string()), error: v.optional(v.string()) })),
  },
  handler: async (ctx, args) => {
    let sent = 0
    let failed = 0
    for (const recipient of args.recipients) {
      if (recipient.error) {
        await ctx.db.patch(recipient.id, { status: "failed", error: recipient.error })
        failed += 1
      } else {
        await ctx.db.patch(recipient.id, { status: "sent", resendId: recipient.resendId, sentAt: Date.now() })
        sent += 1
      }
    }
    const broadcast = await ctx.db.get(args.broadcastId)
    if (broadcast) await ctx.db.patch(args.broadcastId, { sentCount: broadcast.sentCount + sent, failedCount: broadcast.failedCount + failed })
  },
})

export const finishBroadcast = internalMutation({
  args: { broadcastId: v.id("broadcasts") },
  handler: async (ctx, args) => {
    const broadcast = await ctx.db.get(args.broadcastId)
    if (!broadcast) return null
    const pending = await ctx.db.query("broadcastRecipients").withIndex("by_broadcast_status", (q) => q.eq("broadcastId", args.broadcastId).eq("status", "pending")).first()
    const sending = await ctx.db.query("broadcastRecipients").withIndex("by_broadcast_status", (q) => q.eq("broadcastId", args.broadcastId).eq("status", "sending")).first()
    if (!pending && !sending) await ctx.db.patch(args.broadcastId, { status: broadcast.failedCount ? "failed" : "completed", sentAt: Date.now() })
    return await ctx.db.get(args.broadcastId)
  },
})

export const failBroadcast = internalMutation({
  args: { broadcastId: v.id("broadcasts"), error: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.broadcastId, { status: "failed", error: args.error.slice(0, 500), sentAt: Date.now() })
  },
})
