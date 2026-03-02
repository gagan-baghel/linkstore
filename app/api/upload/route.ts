import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

import { getSafeServerSession } from "@/lib/auth"
import { checkRateLimit, enforceSameOrigin, getClientIp, tooManyRequests } from "@/lib/security"
import { requireActiveSubscription } from "@/lib/subscription-access"

// Configure Cloudinary with the environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function detectMimeFromMagic(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg"
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  )
    return "image/png"
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  )
    return "image/webp"
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  )
    return "image/gif"

  return null
}

export async function POST(req: Request) {
  try {
    const csrfBlock = enforceSameOrigin(req)
    if (csrfBlock) return csrfBlock

    const ip = getClientIp(req.headers)
    const rate = checkRateLimit({ key: `api:upload:${ip}`, windowMs: 60 * 1000, max: 30 })
    if (!rate.allowed) {
      return tooManyRequests(rate.retryAfterSec)
    }

    const session = await getSafeServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const access = await requireActiveSubscription(session.user.id, "upload_asset")
    if (!access.ok) return access.response

    const formData = await req.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 })
    }

    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ message: "Unsupported file type. Use JPG, PNG, WEBP, or GIF." }, { status: 400 })
    }

    const maxBytes = 5 * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json({ message: "File is too large. Max size is 5MB." }, { status: 400 })
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ message: "Cloudinary is not configured" }, { status: 503 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const detectedType = detectMimeFromMagic(buffer)
    if (!detectedType || !allowedTypes.has(detectedType)) {
      return NextResponse.json({ message: "File content does not match an allowed image type." }, { status: 400 })
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `affiliate-platform/${session.user.id}`,
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        },
      )

      uploadStream.write(buffer)
      uploadStream.end()
    })

    return NextResponse.json({ url: (result as any).secure_url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
