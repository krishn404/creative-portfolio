import type { ReactNode } from "react"
import { buildMetadata } from "@/lib/seo/metadata"

export const metadata = buildMetadata({
  title: "CD Player Generator — Krishna Kant Maharshi",
  description: "Create and preview a custom browser-based CD player card for a track.",
  path: "/cd-player",
})

export default function CdPlayerLayout({ children }: { children: ReactNode }) {
  return children
}
