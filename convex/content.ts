import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const get = query({
  args: {},
  handler: async (ctx) => {
    const content = await ctx.db
      .query("content")
      .filter((q) => q.eq(q.field("id"), "singleton"))
      .first()

    if (!content) {
      // Return default content if none exists
      return {
        about: {
          headline: "Visual designer and creative working across music, film, culture, and apparel.",
          paragraphs: [
            "I’m Krishna Kant Maharshi, an independent visual designer and creative working across music, film, culture, and apparel.",
            "I make posters, cover artwork, social campaigns, identities, and other visual work that helps ideas find their shape. My practice sits between graphic design, writing, image-making, and visual direction. I’m interested in work that feels immediate, a little strange, and connected to the personality behind it.",
            "Alongside my independent work, I work with a music production house startup and a film and video production house. I also create posters and promotional visuals for rap artists, stand-up comics, and other creative projects.",
            "I write as well. Through interviews, reviews, and conversations, I explore the people and ideas shaping music and visual culture.",
            "I’m open to freelance commissions, collaborations, and creative roles in design, content, music, and media.",
          ],
          tags: [
            "Poster design",
            "Cover artwork",
            "Campaign visuals",
            "Art direction",
            "Social content",
            "Writing",
            "Basic video editing",
            "Apparel graphics",
          ],
        },
        contact: {
          email: "psyxdes@gmail.com",
          cta: "I’m available for poster design, cover artwork, campaign visuals, creative direction, writing, and selected freelance collaborations.\n\nTell me what you’re making, what you need, and when you need it.",
          socials: [
            { label: "Instagram", href: "https://instagram.com/kantcancook" },
            { label: "Pinterest", href: "https://pinterest.com/psyxyx" },
            // { label: "LinkedIn", href: "https://linkedin.com/in/krishn404" },
            { label: "Email", href: "mailto:psyxdes@gmail.com" },
          ],
        },
        footer: {
          note: "© 2026 Krishna Kant Maharshi. All rights reserved.",
        },
      }
    }

    return {
      about: content.about,
      contact: content.contact,
      footer: content.footer,
    }
  },
})

export const upsert = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("content")
      .filter((q) => q.eq(q.field("id"), "singleton"))
      .first()

    const payload = {
      id: "singleton",
      about: args.about,
      contact: args.contact,
      footer: args.footer,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      await ctx.db.patch(existing._id, payload)
    } else {
      await ctx.db.insert("content", payload)
    }

    return { ok: true }
  },
})
