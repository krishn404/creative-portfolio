"use client"

import { useRouter } from "next/navigation"
import { PostEditorForm } from "@/components/blog/PostEditorForm"
import { updatePostAction } from "../actions"
import type { BlogPost } from "@/lib/blog/utils"

export function EditPostClient({ post }: { post: BlogPost }) {
  const router = useRouter()

  return (
    <PostEditorForm
      post={post}
      onSave={async (data) => {
        await updatePostAction(post.id, data)
        router.refresh()
      }}
    />
  )
}
