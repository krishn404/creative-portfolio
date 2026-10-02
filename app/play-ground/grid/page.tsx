import type { Metadata } from "next"
import PosterIntro from "@/features/play-ground/grid/PosterIntro"
import { posters } from "@/features/play-ground/grid/poster-data"

export const metadata: Metadata = {
  title: "365 Posters — Krishna Kant Maharshi",
  description: "A cinematic introduction to a year of poster design.",
}

export default function PosterGridPage() {
  return <PosterIntro posters={posters} />
}
