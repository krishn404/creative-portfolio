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
          headline: "Building stories through design and creativity",
          paragraphs: [
            "I am the Creative Head at The Blackbombay House, a music production company where I manage and create visual work across different areas like social media, branding, video editing, and storytelling.",
            "My work includes graphic design, writing copy and scripts, basic video editing, and leading creative campaigns that connect with people. I enjoy shaping ideas into visuals that tell clear and engaging stories.",
            "Open for freelance, collaboration, and creative roles in design, content, and media.",
          ],
          tags: ["Creative Direction", "Graphic Design", "Video Editing", "Copywriting", "Social Media Creatives"],
        },
        contact: {
          email: "psyxdes@gmail.com",
          cta: "Interested in collaborating or commissioning a piece? I'd love to hear about your project.",
          socials: [
            { label: "Instagram", href: "https://instagram.com/kantcancook" },
            { label: "Pinterest", href: "https://pinterest.com/psyxyx" },
            { label: "LinkedIn", href: "https://linkedin.com/in/krishn404" },
            { label: "Email", href: "mailto:psyxdes@gmail.com" },
          ],
        },
        footer: {
          note: "© 2025 Krishnakant Maharshi. All rights reserved.",
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
