import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import { AdminBlogDashboard } from "@/components/blog/AdminBlogDashboard"
import { deletePostAction, togglePublishPostAction } from "./actions"
import type { BlogPost } from "@/lib/blog/utils"

export default async function AdminBlogPage() {
  let posts: BlogPost[] = []
  try {
    posts = await convex.query(api.posts.getAllPostsAdmin)
  } catch (error) {
    console.error("Failed to fetch admin posts:", error)
  }

  return (
    <AdminBlogDashboard
      initialPosts={posts}
      onDelete={deletePostAction}
      onTogglePublish={togglePublishPostAction}
    />
  )
}
