"use client"

import { useRouter } from "next/navigation"
import { PostEditorForm } from "@/components/blog/PostEditorForm"
import { CollaboratorAccess } from "@/components/blog/CollaboratorAccess"
import { CollaboratorDraftReview } from "@/components/blog/CollaboratorDraftReview"
import { applyCollaboratorDraftAction, discardCollaboratorDraftAction, setPostCollaboratorAccessAction, updatePostAction } from "../actions"
import type { BlogPost } from "@/lib/blog/utils"

export function EditPostClient({ post }: { post: BlogPost }) {
  const router = useRouter()

  return (
    <>
      {post.collaboratorDraft ? (
        <CollaboratorDraftReview
          draft={post.collaboratorDraft}
          post={post}
          onApply={async () => {
            await applyCollaboratorDraftAction(post.id)
            router.refresh()
          }}
          onDiscard={async () => {
            await discardCollaboratorDraftAction(post.id)
            router.refresh()
          }}
        />
      ) : null}
      <CollaboratorAccess
        postId={post.id}
        enabled={post.collaboratorEnabled ?? false}
        onChange={async (enabled) => {
          const result = await setPostCollaboratorAccessAction(post.id, enabled)
          router.refresh()
          return result
        }}
      />
      <PostEditorForm
        post={post}
        onSave={async (data) => {
          const result = await updatePostAction(post.id, data)
          if (!result.ok) throw new Error(result.message)
          router.refresh()
        }}
      />
    </>
  )
}
