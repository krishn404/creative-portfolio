import { notFound } from "next/navigation"
import { CollaboratorEditGate } from "@/components/blog/CollaboratorEditGate"
import { authenticateCollaboratorAction, updateCollaboratorPostAction } from "@/app/admin/blog/actions"

export const dynamic = "force-dynamic"
export const metadata = { robots: { index: false, follow: false } }

type PageProps = { params: Promise<{ slug: string; token: string }> }

export default async function CollaboratorEditPage({ params }: PageProps) {
  const { slug, token } = await params
  if (!/^[A-Z0-9]{4}$/.test(token)) notFound()

  return <CollaboratorEditGate slug={slug} code={token} onAuthenticate={authenticateCollaboratorAction} onSave={updateCollaboratorPostAction} />
}
