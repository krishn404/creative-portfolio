# 365 Poster Artwork

The original 365 challenge artwork was not present in the project when this route was built. The `/play-ground/grid` intro therefore uses six existing local portfolio pieces from `public/gallery/` as replaceable sample artwork; it does not fetch or invent external image URLs.

Add the challenge artwork to this directory (for example, `day-001.webp` through `day-365.webp`) and update `features/play-ground/grid/poster-data.ts` to point each poster's `image` field at `/posters/...`. The data file also contains the initial, grid, and stack positions used by the animation.
