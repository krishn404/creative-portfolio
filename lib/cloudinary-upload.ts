export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

export function assertUploadableFile(file: File): void {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported")
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Image must be under ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB`)
  }
}

/** Apply a Cloudinary fetch transform for lighter browser previews. */
export function getCloudinaryTransformedUrl(url: string, transform: string): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url
  }
  if (url.includes(`/upload/${transform}/`)) {
    return url
  }
  return url.replace("/upload/", `/upload/${transform}/`)
}

const COVER_DISPLAY_TRANSFORM = "f_auto,q_auto,w_1200,h_675,c_fill"
const COVER_OG_TRANSFORM = "f_auto,q_auto,w_1200,h_630,c_fill"

export function getCoverPreviewUrl(
  url: string,
  options?: { width?: number; height?: number },
): string {
  if (options?.width || options?.height) {
    const width = options.width ?? 1200
    const height = options.height ?? Math.round(width / (16 / 9))
    return getCloudinaryTransformedUrl(url, `f_auto,q_auto,w_${width},h_${height},c_fill`)
  }
  return getCloudinaryTransformedUrl(url, COVER_DISPLAY_TRANSFORM)
}

export function getCoverOgUrl(url: string): string {
  return getCloudinaryTransformedUrl(url, COVER_OG_TRANSFORM)
}

async function uploadFileToCloudinaryWithPurpose(
  file: File,
  purpose: "default" | "cover",
): Promise<{ secureUrl: string; publicId: string }> {
  assertUploadableFile(file)

  const sigRes = await fetch(`/api/upload?purpose=${purpose}`, {
    method: "POST",
    cache: "no-store",
    credentials: "include",
  })
  if (!sigRes.ok) {
    const errorData = (await sigRes.json().catch(() => ({}))) as { error?: string }
    throw new Error(errorData?.error || "Failed to fetch upload signature")
  }

  const signaturePayload = (await sigRes.json()) as {
    timestamp: number | string
    signature: string
    apiKey: string
    cloudName: string
    folder: string
    transformation?: string
  }

  const cloudinaryFormData = new FormData()
  cloudinaryFormData.append("file", file)
  cloudinaryFormData.append("api_key", signaturePayload.apiKey)
  cloudinaryFormData.append("timestamp", String(signaturePayload.timestamp))
  cloudinaryFormData.append("signature", signaturePayload.signature)
  cloudinaryFormData.append("folder", signaturePayload.folder)
  if (signaturePayload.transformation) {
    cloudinaryFormData.append("transformation", signaturePayload.transformation)
  }

  const cloudinaryRes = await fetch(
    `https://api.cloudinary.com/v1_1/${signaturePayload.cloudName}/auto/upload`,
    { method: "POST", body: cloudinaryFormData },
  )

  const cloudinaryData = (await cloudinaryRes.json().catch(() => null)) as
    | { secure_url?: unknown; public_id?: unknown; error?: { message?: unknown } | string }
    | null

  if (!cloudinaryRes.ok || !cloudinaryData?.secure_url || !cloudinaryData?.public_id) {
    const errMsg =
      (typeof cloudinaryData?.error === "string" && cloudinaryData.error) ||
      (typeof cloudinaryData?.error === "object" &&
        typeof cloudinaryData.error?.message === "string" &&
        cloudinaryData.error.message) ||
      `Cloudinary upload failed with status ${cloudinaryRes.status}`
    throw new Error(errMsg)
  }

  return {
    secureUrl: cloudinaryData.secure_url as string,
    publicId: cloudinaryData.public_id as string,
  }
}

export async function uploadFileToCloudinary(file: File): Promise<{ secureUrl: string; publicId: string }> {
  return uploadFileToCloudinaryWithPurpose(file, "default")
}

export async function uploadCoverImageToCloudinary(
  file: File,
): Promise<{ secureUrl: string; publicId: string }> {
  return uploadFileToCloudinaryWithPurpose(file, "cover")
}

export function isLikelyImageUrl(text: string): boolean {
  const trimmed = text.trim()
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i.test(trimmed)
}
