export async function uploadFileToCloudinary(file: File): Promise<{ secureUrl: string; publicId: string }> {
  const sigRes = await fetch("/api/upload", { method: "POST", cache: "no-store" })
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
  }

  const cloudinaryFormData = new FormData()
  cloudinaryFormData.append("file", file)
  cloudinaryFormData.append("api_key", signaturePayload.apiKey)
  cloudinaryFormData.append("timestamp", String(signaturePayload.timestamp))
  cloudinaryFormData.append("signature", signaturePayload.signature)
  cloudinaryFormData.append("folder", signaturePayload.folder)

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

export function isLikelyImageUrl(text: string): boolean {
  const trimmed = text.trim()
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i.test(trimmed)
}
