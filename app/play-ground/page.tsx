import PlayGround from "@/features/play-ground/PlayGround"
import { buildMetadata } from "@/lib/seo/metadata"

export const metadata = buildMetadata({
  title: "Play Ground — Krishna Kant Maharshi",
  description: "A browser based image and video texture editor.",
  path: "/play-ground",
})

export default function PlayGroundPage() {
  return <PlayGround />
}
