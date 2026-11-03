import DomeGallery from "@/components/gallery/DomeGallery"
import { buildMetadata } from "@/lib/seo/metadata"
import "./gallery.css"

export const metadata = buildMetadata({
  title: "365 Photo Challenge — PSYX",
  description: "An immersive, draggable photographic dome.",
  path: "/test",
})

export default function TestGalleryPage() {
  return <DomeGallery />
}
