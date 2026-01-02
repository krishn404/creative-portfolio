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
const isCloudinaryConfigured = Boolean(
  cloudinaryConfig.cloud_name && 
  cloudinaryConfig.api_key && 
  cloudinaryConfig.api_secret
)

if (!isCloudinaryConfigured) {
  console.error("❌ Cloudinary configuration missing!")
  console.error("CLOUDINARY_CLOUD_NAME:", cloudinaryConfig.cloud_name ? "✓ Set" : "✗ Missing")
  console.error("CLOUDINARY_API_KEY:", cloudinaryConfig.api_key ? "✓ Set" : "✗ Missing")
  console.error("CLOUDINARY_API_SECRET:", cloudinaryConfig.api_secret ? "✓ Set" : "✗ Missing")
} else {
  cloudinary.config(cloudinaryConfig)
  console.log("✓ Cloudinary configured successfully")
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    if (!isAuthenticated(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate Cloudinary configuration
    if (!isCloudinaryConfigured) {
      const errorMessage = "Cloudinary configuration is missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables."
      console.error(errorMessage)
      return NextResponse.json(
        { 
          error: process.env.NODE_ENV === "development" 
            ? errorMessage 
            : "Upload service configuration error" 
        },
        { status: 500 }
      )
    }

    const form = await request.formData()
    const file = form.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    console.log(`📤 Uploading image: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)

    const buffer = Buffer.from(await file.arrayBuffer())

    const upload = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "creative-portfolio",
          resource_type: "image",
          timeout: 60000,
        },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary upload stream error:", error)
            reject(error)
          } else if (!result) {
            console.error("❌ Cloudinary upload returned no result")
            reject(new Error("Upload failed: No result from Cloudinary"))
          } else {
            console.log("✓ Upload successful:", result.public_id)
            resolve({ secure_url: result.secure_url, public_id: result.public_id })
          }
        }
      )

      stream.on("error", (err) => {
        console.error("❌ Cloudinary stream error:", err)
        reject(err)
      })

      stream.end(buffer)
    })

    return NextResponse.json({ url: upload.secure_url, publicId: upload.public_id })
  } catch (error) {
    console.error("❌ Cloudinary upload failed:", error)
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    
    const errorMessage = process.env.NODE_ENV === "development"
      ? `Upload failed: ${error instanceof Error ? error.message : String(error)}`
      : "Upload failed. Please try again."
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}