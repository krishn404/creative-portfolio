import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import { getDefaultContent, type SiteContent } from "@/lib/content"
import AdminDashboard from "@/components/admin/dashboard"
import { deleteWorkAction, saveContentAction, updateWorkStatusAction, upsertWorkAction } from "./actions"

export default async function AdminPage() {
  let initialContent: SiteContent
  try {
    const data = await convex.query(api.content.get)
    const works = await convex.query(api.works.listAll)
    initialContent = { ...data, works } as SiteContent
  } catch (error) {
    console.error("Failed to fetch initial content:", error)
    initialContent = getDefaultContent()
  }

  return (
    <AdminDashboard
      initialContent={initialContent}
      actions={{
        saveContent: saveContentAction,
        upsertWork: upsertWorkAction,
        updateWorkStatus: updateWorkStatusAction,
        deleteWork: deleteWorkAction,
      }}
    />
  )
}
