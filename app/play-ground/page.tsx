import type { Metadata } from "next"
import PlayGround from "@/features/play-ground/PlayGround"

export const metadata: Metadata = {
  title: "Play Ground — Krishna Kant Maharshi",
  description: "A browser based image and video texture editor.",
}

export default function PlayGroundPage() {
  return <PlayGround />
}
