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
        const result = await updatePostAction(post.id, data)
        if (!result.ok) throw new Error(result.message)
        router.refresh()
      }}
    />
  )
}
