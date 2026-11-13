import { action } from "./_generated/server"
import { v } from "convex/values"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { buildNewsletterContent } from "./newsletterTemplate"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
type BatchRecipient = { _id: Id<"broadcastRecipients">; subscriberId: Id<"subscribers">; email: string }
type BroadcastRecord = { subject: string; html: string; text: string; status: "sending" | "completed" | "failed"; sentCount: number; failedCount: number }

function assertAdminToken(token: string) {
  const expected = process.env.ADMIN_SESSION_TOKEN
  if (!expected || token !== expected) throw new Error("UNAUTHORIZED")
}

function config() {
  const apiKey = process.env.RESEND_API_KEY
  const siteUrl = process.env.SITE_URL?.replace(/\/$/, "")
  const from = process.env.NEWSLETTER_FROM
  if (!apiKey || !siteUrl || !from) throw new Error("NEWSLETTER_CONFIG_MISSING")
  return { apiKey, siteUrl, from }
}

function unsubscribeUrl(siteUrl: string, subscriberId: string) {
  return `${siteUrl}/unsubscribe?id=${encodeURIComponent(subscriberId)}`
}

async function sendBatch(
  apiKey: string,
  batchKey: string,
  messages: Array<{ from: string; to: string[]; subject: string; html: string; text: string; headers: Record<string, string> }>,
) {
  const response = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": batchKey,
    },
    body: JSON.stringify(messages),
  })
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
      ? payload.message
      : `Resend request failed (${response.status})`
    throw new Error(detail)
  }
  if (!payload || typeof payload !== "object" || !("data" in payload) || !Array.isArray(payload.data)) {
    throw new Error("Unexpected Resend batch response")
  }
  return payload.data.map((item) => item && typeof item === "object" && "id" in item && typeof item.id === "string" ? item.id : undefined)
}

export const sendBroadcast = action({
  args: { adminToken: v.string(), broadcastId: v.id("broadcasts") },
  handler: async (ctx, args): Promise<{ status: "sending" | "completed" | "failed"; sentCount: number; failedCount: number }> => {
    assertAdminToken(args.adminToken)
    const broadcast = await ctx.runQuery(internal.newsletter.getBroadcast, { id: args.broadcastId }) as BroadcastRecord | null
    if (!broadcast) throw new Error("BROADCAST_NOT_FOUND")
    if (broadcast.status === "completed") return { status: "completed", sentCount: broadcast.sentCount, failedCount: broadcast.failedCount }

    let settings: ReturnType<typeof config>
    try {
      settings = config()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Newsletter configuration is missing"
      await ctx.runMutation(internal.newsletter.failBroadcast, { broadcastId: args.broadcastId, error: message })
      throw error
    }
    const { apiKey, siteUrl, from } = settings

    const subscribers = await ctx.runQuery(internal.newsletter.getActiveSubscribers, {}) as Array<{ id: Id<"subscribers">; email: string }>
    for (let index = 0; index < subscribers.length; index += 250) {
      await ctx.runMutation(internal.newsletter.seedRecipients, { broadcastId: args.broadcastId, subscribers: subscribers.slice(index, index + 250) })
    }

    while (true) {
      const claimed = await ctx.runMutation(internal.newsletter.claimNextBatch, { broadcastId: args.broadcastId }) as { recipients: BatchRecipient[]; batchKey: string }
      if (!claimed.recipients.length) break
      const messages = claimed.recipients.map((recipient) => {
        const url = unsubscribeUrl(siteUrl, recipient.subscriberId)
        return {
          from,
          to: [recipient.email],
          subject: broadcast.subject,
          html: broadcast.html.replaceAll("{{unsubscribeUrl}}", url),
          text: broadcast.text.replaceAll("{{unsubscribeUrl}}", url),
          headers: {
            "List-Unsubscribe": `<${url}>`,
          },
        }
      })

      try {
        const resendIds = await sendBatch(apiKey, claimed.batchKey, messages)
        await ctx.runMutation(internal.newsletter.markBatch, {
          broadcastId: args.broadcastId,
          recipients: claimed.recipients.map((recipient, index) => ({ id: recipient._id, resendId: resendIds[index] })),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Resend batch failed"
        await ctx.runMutation(internal.newsletter.markBatch, {
          broadcastId: args.broadcastId,
          recipients: claimed.recipients.map((recipient) => ({ id: recipient._id, error: message })),
        })
      }
    }

    const finished = await ctx.runMutation(internal.newsletter.finishBroadcast, { broadcastId: args.broadcastId }) as BroadcastRecord | null
    return { status: finished?.status ?? "failed", sentCount: finished?.sentCount ?? 0, failedCount: finished?.failedCount ?? 0 }
  },
})

export const sendTest = action({
  args: { adminToken: v.string(), email: v.string(), subject: v.string(), workUpdate: v.string(), affirmation: v.string() },
  handler: async (ctx, args) => {
    assertAdminToken(args.adminToken)
    if (!emailPattern.test(args.email.trim())) throw new Error("INVALID_EMAIL")
    const { apiKey, siteUrl, from } = config()
    const content = buildNewsletterContent(args.subject.trim(), args.workUpdate.trim(), args.affirmation.trim())
    const url = `${siteUrl}/letter`
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [args.email.trim().toLowerCase()],
        subject: `[TEST] ${args.subject.trim()}`,
        html: content.html.replaceAll("{{unsubscribeUrl}}", url),
        text: content.text.replaceAll("{{unsubscribeUrl}}", url),
        headers: { "List-Unsubscribe": `<${url}>` },
      }),
    })
    if (!response.ok) throw new Error(`Resend test failed (${response.status})`)
    return { ok: true }
  },
})
