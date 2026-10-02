import type { Metadata } from "next"
import DomeGallery from "@/components/gallery/DomeGallery"
import "./gallery.css"

export const metadata: Metadata = {
  title: "Inverted Dome — PSYX",
  description: "An immersive, draggable photographic dome.",
}

export default function TestGalleryPage() {
  return <DomeGallery />
}
