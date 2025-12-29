import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { isAuthenticated } from "@/lib/auth"

// Validate Cloudinary configuration
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
}

// Check if all Cloudinary env vars are set
if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
  console.error("Cloudinary configuration missing. Required env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET")
}

cloudinary.config(cloudinaryConfig)

export async function POST(request: NextRequest) {
  // Check authentication
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Validate Cloudinary configuration
  if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
    const errorMessage = "Cloudinary configuration is missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables."
    console.error(errorMessage)
    return NextResponse.json(
      { 
        error: process.env.NODE_ENV === "development" ? errorMessage : "Upload service configuration error" 
      },
      { status: 500 }
    )
  }

  try {
    const form = await request.formData()
    const file = form.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    // Validate file size (optional: limit to 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const upload = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "creative-portfolio",
          resource_type: "image",
          // Add timeout and error handling
          timeout: 60000, // 60 seconds
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload stream error:", error)
            reject(error)
          } else if (!result) {
            console.error("Cloudinary upload returned no result")
            reject(new Error("Upload failed: No result from Cloudinary"))
          } else {
            resolve({ secure_url: result.secure_url, public_id: result.public_id })
          }
        }
      )

      stream.on("error", (err) => {
        console.error("Cloudinary stream error:", err)
        reject(err)
      })

      stream.end(buffer)
    })

    return NextResponse.json({ url: upload.secure_url, publicId: upload.public_id })
  } catch (error) {
    console.error("Cloudinary upload failed:", error)
    
    // Provide more detailed error in development
    const errorMessage = process.env.NODE_ENV === "development"
      ? `Upload failed: ${error instanceof Error ? error.message : String(error)}`
      : "Upload failed. Please check server logs for details."
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
