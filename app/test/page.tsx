import DomeGallery from "@/components/gallery/DomeGallery"
import { buildMetadata } from "@/lib/seo/metadata"
import "./gallery.css"

const galleryMetadata = buildMetadata({
  title: "365 Photo Challenge — PSYX",
  description: "An immersive, draggable photographic dome.",
  path: "/test",
})

export const metadata = {
  ...galleryMetadata,
  robots: { index: false, follow: true },
}

export default function TestGalleryPage() {
  return <DomeGallery />
}
