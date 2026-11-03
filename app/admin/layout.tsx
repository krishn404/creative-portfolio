import type { ReactNode } from "react"
import type { Metadata } from "next"
import { AdminBlurGuard } from "@/components/admin/AdminBlurGuard"

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminBlurGuard>{children}</AdminBlurGuard>
}
