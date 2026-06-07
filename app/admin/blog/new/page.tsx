"use client"

import { useRouter } from "next/navigation"
import { PostEditorForm } from "@/components/blog/PostEditorForm"
import { createPostAction } from "../actions"

export default function NewBlogPostPage() {
  const router = useRouter()

  return (
    <PostEditorForm
      onSave={async (data) => {
        const result = await createPostAction(data)
        router.push(`/admin/blog/${result.id}`)
        router.refresh()
      }}
    />
  )
}
