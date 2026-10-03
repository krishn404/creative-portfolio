import { NextResponse } from "next/server"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import { toBlogPostCard, type BlogPost } from "@/lib/blog/utils"

export async function GET() {
  try {
    const published = await convex.query(api.posts.getPublishedPosts) as BlogPost[]
    const posts = published.map(toBlogPostCard)
    return NextResponse.json({ posts })
  } catch (error) {
    console.error("Failed to fetch blog posts:", error)
    return NextResponse.json({ posts: [] })
  }
}
