import type { MetadataRoute } from "next"
import { SITE_NAME, SITE_URL } from "@/lib/seo/constants"

export const dynamic = "force-static"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "kantcancook",
    description:
      "Visual design, posters, cover art, campaigns, writing, and creative direction by Krishna Kant Maharshi.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    id: new URL("/", SITE_URL).toString(),
    icons: [
      {
        src: "/pfp.jpg",
        type: "image/jpeg",
        sizes: "512x512",
        purpose: "any",
      },
    ],
  }
}
