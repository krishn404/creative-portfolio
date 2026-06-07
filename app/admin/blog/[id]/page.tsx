import { notFound } from "next/navigation"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { EditPostClient } from "./edit-client"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditBlogPostPage({ params }: PageProps) {
  const { id } = await params

  let post = null
  try {
    post = await convex.query(api.posts.getPostById, { id: id as Id<"posts"> })
  } catch {
    post = null
  }

  if (!post) notFound()

  return <EditPostClient post={post} />
}
