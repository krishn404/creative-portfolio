import { createHash } from "node:crypto"
import { notFound } from "next/navigation"
import { CollaboratorPostEditor } from "@/components/blog/CollaboratorPostEditor"
import { updateCollaboratorPostAction } from "@/app/admin/blog/actions"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"

export const dynamic = "force-dynamic"
export const metadata = { robots: { index: false, follow: false } }

type PageProps = { params: Promise<{ slug: string; token: string }> }

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export default async function CollaboratorEditPage({ params }: PageProps) {
  const { slug, token } = await params
  if (token.length < 32 || token.length > 200) notFound()

  const post = await convex.query(api.posts.getCollaboratorPost, { slug, tokenHash: hashToken(token) })
  if (!post) notFound()

  return <CollaboratorPostEditor post={post} token={token} onSave={updateCollaboratorPostAction} />
}
