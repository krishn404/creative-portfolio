import { readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import nextEnv from "@next/env"
import cloudinary from "cloudinary"

nextEnv.loadEnvConfig(process.cwd())

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET
if (!cloudName || !apiKey || !apiSecret) {
  throw new Error("Cloudinary credentials are incomplete. Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.")
}

cloudinary.v2.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true })

const sourceDirectory = path.resolve("public/365")
const outputFile = path.resolve("src/data/cloudinary-gallery.json")
const folder = [process.env.CLOUDINARY_UPLOAD_FOLDER || "creative-portfolio", "365"].join("/")
const concurrency = 4
const files = (await readdir(sourceDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && /\.jpe?g$/i.test(entry.name))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))

if (files.length === 0) throw new Error(`No JPG images found in ${sourceDirectory}`)
if (files.length !== 365) console.warn(`Found ${files.length} JPGs; the dome will contain the available files until all 365 originals are present.`)

const originalManifest = JSON.parse(await readFile(path.join(sourceDirectory, "manifest.json"), "utf8"))
const metadataByFile = new Map(originalManifest.map((entry) => [entry.file, entry]))
const results = new Array(files.length)
let nextIndex = 0
let completed = 0

function variant(publicId, width, height = undefined) {
  return cloudinary.v2.url(publicId, {
    secure: true,
    transformation: [{
      width,
      ...(height ? { height, crop: "fill" } : { crop: "limit" }),
      quality: "auto",
      fetch_format: "auto",
    }],
  })
}

if (process.argv.includes("--verify-only")) {
  const remote = await cloudinary.v2.api.resources({ type: "upload", prefix: `${folder}/`, max_results: 500 })
  const remoteIds = new Set(remote.resources.map((asset) => asset.public_id))
  const missing = files.filter((file) => !remoteIds.has(`${folder}/${path.parse(file).name}`))
  console.log(`Cloudinary assets found: ${remote.resources.length}; local JPGs: ${files.length}; missing: ${missing.length}.`)
  if (missing.length > 0) console.log(`Missing public IDs: ${missing.map((file) => path.parse(file).name).join(", ")}`)
  if (remote.next_cursor) console.warn("The Cloudinary folder has more than 500 assets; rerun verification with a narrowed folder.")
  process.exitCode = missing.length === 0 ? 0 : 1
  process.exit()
}

if (process.argv.includes("--refresh-only")) {
  const current = JSON.parse(await readFile(outputFile, "utf8"))
  for (const image of current) {
    const publicId = `${folder}/${image.id}`
    image.thumbnail = variant(publicId, 320)
    image.variants = {
      tiny: variant(publicId, 24, 24),
      320: variant(publicId, 320),
      640: variant(publicId, 640),
      960: variant(publicId, 960),
    }
  }
  await writeFile(outputFile, `${JSON.stringify(current, null, 2)}\n`, "utf8")
  console.log(`Refreshed delivery URLs for ${current.length} gallery images.`)
  process.exit(0)
}

async function uploadFile(index) {
  const file = files[index]
  const absolutePath = path.join(sourceDirectory, file)
  const publicId = `${folder}/${path.parse(file).name}`
  let asset

  try {
    asset = await cloudinary.v2.uploader.upload(absolutePath, {
      public_id: publicId,
      resource_type: "image",
      overwrite: false,
      unique_filename: false,
      use_filename: false,
      format: "jpg",
    })
  } catch (error) {
    const status = error?.http_code ?? error?.httpCode
    if (status !== 409) throw new Error(`Cloudinary upload failed for ${file} (HTTP ${status ?? "unknown"}).`)
    asset = await cloudinary.v2.api.resource(publicId, { resource_type: "image" })
  }

  const meta = metadataByFile.get(file)
  const width = asset.width
  const height = asset.height
  const record = {
    id: path.parse(file).name,
    src: asset.secure_url,
    thumbnail: variant(asset.public_id, 320),
    width,
    height,
    aspectRatio: width / height,
    alt: meta?.alt || meta?.caption || `Photograph ${index + 1}`,
    variants: {
      tiny: variant(asset.public_id, 24, 24),
      320: variant(asset.public_id, 320),
      640: variant(asset.public_id, 640),
      960: variant(asset.public_id, 960),
    },
  }
  results[index] = record
  completed += 1
  if (completed % 25 === 0 || completed === files.length) console.log(`Uploaded ${completed}/${files.length}`)
}

await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, async () => {
  while (nextIndex < files.length) {
    const index = nextIndex++
    await uploadFile(index)
  }
}))

await writeFile(outputFile, `${JSON.stringify(results, null, 2)}\n`, "utf8")
console.log(`Wrote ${results.length} image records to ${path.relative(process.cwd(), outputFile)}`)
