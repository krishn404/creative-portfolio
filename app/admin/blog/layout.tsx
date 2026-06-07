import type { ReactNode } from "react"
import { AdminAuthGate } from "@/components/blog/AdminAuthGate"

export default function AdminBlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="blog-shell min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <AdminAuthGate>{children}</AdminAuthGate>
      </div>
    </div>
  )
}
