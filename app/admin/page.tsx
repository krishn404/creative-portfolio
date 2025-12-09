import { readContent, type SiteContent } from "@/lib/content"
import AdminDashboard from "@/components/admin/dashboard"
import { deleteWorkAction, saveContentAction, upsertWorkAction } from "./actions"

export default async function AdminPage() {
  const initialContent = (await readContent()) as SiteContent

  return (
    <AdminDashboard
      initialContent={initialContent}
      actions={{
        saveContent: saveContentAction,
        upsertWork: upsertWorkAction,
        deleteWork: deleteWorkAction,
      }}
    />
  )
}

