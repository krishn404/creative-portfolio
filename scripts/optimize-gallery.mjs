import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const sourceDir = path.resolve("public/gallery")
const sizes = [
  { name: "tiny", width: 28, quality: 24, blur: 2 },
  { name: "320", width: 320, quality: 72 },
  { name: "640", width: 640, quality: 78 },
  { name: "960", width: 960, quality: 82 },
]

for (let number = 1; number <= 365; number += 1) {
  const id = String(number).padStart(3, "0")
  const sourceName = number <= 6 ? `${number}.jpg` : `${id}.jpg`
  const source = path.join(sourceDir, sourceName)
  try {
    await fs.access(source)
  } catch {
    console.error(`Missing source JPG: ${sourceName}`)
    process.exitCode = 1
    continue
  }

  const image = sharp(source, { failOn: "none" }).rotate()
  const metadata = await image.metadata()
  if (!metadata.width || !metadata.height) {
    console.error(`Could not read dimensions: ${sourceName}`)
    process.exitCode = 1
    continue
  }

  await Promise.all(sizes.map(async ({ name, width, quality, blur }) => {
    const outputDir = path.join(sourceDir, name)
    await fs.mkdir(outputDir, { recursive: true })
    let pipeline = sharp(source, { failOn: "none" }).rotate().resize({ width, withoutEnlargement: true })
    if (blur) pipeline = pipeline.blur(blur)
    await pipeline.webp({ quality, effort: 4 }).toFile(path.join(outputDir, `${id}.webp`))
  }))
  console.log(`${id} ${metadata.width}x${metadata.height} → WebP variants`)
}

if (process.exitCode) console.error("Add all 365 original JPGs to public/gallery/ and run the command again.")
