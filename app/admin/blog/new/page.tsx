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
        if (!result.ok) throw new Error(result.message)
        if (!result.id) throw new Error("The post was saved, but its editor link could not be loaded.")
        router.replace(`/admin/blog/${result.id}`)
      }}
    />
  )
}
