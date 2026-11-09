import type { Metadata } from "next"
import type { ReactNode } from "react"
import { BlogHeader } from "@/components/blog/BlogHeader"

export const metadata: Metadata = { keywords: null }

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="blog-shell min-h-screen">
      <BlogHeader />
      <main className="relative z-10">{children}</main>
    </div>
  )
}
