"use client"

import { galleryImages } from "@/src/data/gallery-images"

export default function GalleryFallback() {
  return (
    <div className="dome-fallback" role="region" aria-label="Photograph gallery">
      <p className="dome-fallback-note">WebGL is unavailable here. Browse the photographs in a simple grid instead.</p>
      <div className="dome-fallback-grid">
        {galleryImages.map((image) => (
          <figure key={image.id}>
            {/* eslint-disable-next-line @next/next/no-img-element -- The image source is selected from the gallery's CDN manifest. */}
            <img src={image.thumbnail} alt={image.alt || "Portfolio photograph"} loading="lazy" decoding="async" onError={(event) => event.currentTarget.closest("figure")?.setAttribute("hidden", "true")} />
            <figcaption>{image.id}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
