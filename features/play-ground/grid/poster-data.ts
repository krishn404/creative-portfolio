export type PosterData = {
  id: string
  image: string
  alt: string
  initialPosition: { x: number; y: number }
  gridPosition: { column: number; row: number }
  stackPosition: { x: number; y: number; rotate: number; scale: number }
}

// These are existing portfolio artworks. Swap image paths as the 365-day set is added.
export const posters: PosterData[] = [
  {
    id: "poster-01",
    image: "/gallery/1.jpg",
    alt: "Editorial poster for a music artist",
    initialPosition: { x: -18, y: -30 },
    gridPosition: { column: 1, row: 1 },
    stackPosition: { x: -10, y: -12, rotate: -7, scale: 0.48 },
  },
  {
    id: "poster-02",
    image: "/gallery/2.jpg",
    alt: "Typography poster about creativity and live performance",
    initialPosition: { x: 25, y: -44 },
    gridPosition: { column: 2, row: 1 },
    stackPosition: { x: 8, y: -7, rotate: 5, scale: 0.47 },
  },
  {
    id: "poster-03",
    image: "/gallery/3.jpg",
    alt: "Blue editorial poster for The Black Bombay House",
    initialPosition: { x: -12, y: -18 },
    gridPosition: { column: 3, row: 1 },
    stackPosition: { x: -4, y: 1, rotate: -3, scale: 0.49 },
  },
  {
    id: "poster-04",
    image: "/gallery/4.jpg",
    alt: "Red textured portrait poster",
    initialPosition: { x: 14, y: -34 },
    gridPosition: { column: 1, row: 2 },
    stackPosition: { x: 11, y: 9, rotate: 7, scale: 0.46 },
  },
  {
    id: "poster-05",
    image: "/gallery/5.jpg",
    alt: "Vintage-toned photograph of people travelling by boat",
    initialPosition: { x: -24, y: -24 },
    gridPosition: { column: 2, row: 2 },
    stackPosition: { x: -9, y: 13, rotate: -5, scale: 0.48 },
  },
  {
    id: "poster-06",
    image: "/gallery/6.jpg",
    alt: "Graphic apparel campaign featuring a printed T-shirt",
    initialPosition: { x: 20, y: -14 },
    gridPosition: { column: 3, row: 2 },
    stackPosition: { x: 5, y: 18, rotate: 3, scale: 0.47 },
  },
]
