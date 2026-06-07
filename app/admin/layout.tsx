import type { ReactNode } from "react"
import { AdminBlurGuard } from "@/components/admin/AdminBlurGuard"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminBlurGuard>{children}</AdminBlurGuard>
}
