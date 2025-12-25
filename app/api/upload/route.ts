import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { isAuthenticated } from "@/lib/auth"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const form = await request.formData()
    const file = form.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const upload = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "creative-portfolio",
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) {
            reject(error)
          } else {
            resolve({ secure_url: result.secure_url, public_id: result.public_id })
          }
        }
      )

      stream.end(buffer)
    })

    return NextResponse.json({ url: upload.secure_url, publicId: upload.public_id })
  } catch (error) {
    console.error("Cloudinary upload failed", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
