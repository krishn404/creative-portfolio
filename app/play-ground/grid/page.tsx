import PosterIntro from "@/features/play-ground/grid/PosterIntro"
import { posters } from "@/features/play-ground/grid/poster-data"
import { buildMetadata } from "@/lib/seo/metadata"

export const metadata = buildMetadata({
  title: "365 Posters — Krishna Kant Maharshi",
  description: "A cinematic introduction to a year of poster design.",
  path: "/play-ground/grid",
})

export default function PosterGridPage() {
  return <PosterIntro posters={posters} />
}
