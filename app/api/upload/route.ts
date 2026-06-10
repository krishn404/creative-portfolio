import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { isAuthenticated } from "@/lib/auth"

// Cloudinary SDK requires Node.js — keep off the Edge runtime (Vercel default is Node for App Router).
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Configure Cloudinary once (module scope) using environment variables.
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
}

const isCloudinaryConfigured = Boolean(
  cloudinaryConfig.cloud_name && cloudinaryConfig.api_key && cloudinaryConfig.api_secret,
)

if (isCloudinaryConfigured) {
  cloudinary.config(cloudinaryConfig)
}

const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "creative-portfolio"

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isCloudinaryConfigured) {
    return NextResponse.json({ error: "Upload service configuration error" }, { status: 500 })
  }

  const timestamp = Math.round(Date.now() / 1000)
  // Cap stored dimensions so cover uploads cannot blow up browser memory on preview.
  const transformation = "c_limit,w_2400,f_auto,q_auto"
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, transformation },
    cloudinaryConfig.api_secret as string,
  )

  return NextResponse.json({
    timestamp,
    signature,
    apiKey: cloudinaryConfig.api_key as string,
    cloudName: cloudinaryConfig.cloud_name as string,
    folder,
    transformation,
  })
}