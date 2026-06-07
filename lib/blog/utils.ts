import readingTime from "reading-time"
import type { JSONContent } from "novel"

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function extractTextFromTiptap(node: JSONContent): string {
  if (node.text) return node.text
  if (!node.content) return ""
  return node.content.map(extractTextFromTiptap).join(" ")
}

export function computeReadTime(contentJson: string): string {
  try {
    const json = JSON.parse(contentJson) as JSONContent
    const text = extractTextFromTiptap(json)
    const stats = readingTime(text || " ")
    const minutes = Math.max(1, Math.ceil(stats.minutes))
    return `${minutes} MIN`
  } catch {
    return "1 MIN"
  }
}

export function formatViews(views: number): string {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1).replace(/\.0$/, "")}K`
  }
  return views.toLocaleString()
}

export function formatPostDate(timestamp?: number): string {
  if (!timestamp) return "—"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
    .format(new Date(timestamp))
    .toUpperCase()
}

export function parseTagsInput(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
}

export type BlogPost = {
  id: string
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
}
