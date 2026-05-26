import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomBytes } from "crypto"

function getConfig() {
  const ENDPOINT = process.env.HETZNER_S3_ENDPOINT
  const REGION   = process.env.HETZNER_S3_REGION
  const BUCKET   = process.env.HETZNER_S3_BUCKET
  const ACCESS   = process.env.HETZNER_S3_ACCESS_KEY
  const SECRET   = process.env.HETZNER_S3_SECRET_KEY
  const SSE_KEY     = process.env.FILE_ENCRYPTION_KEY
  const SSE_KEY_MD5 = process.env.FILE_ENCRYPTION_KEY_MD5

  if (!ENDPOINT || !REGION || !BUCKET || !ACCESS || !SECRET || !SSE_KEY || !SSE_KEY_MD5) {
    throw new Error("Saknade miljövariabler för Hetzner Object Storage")
  }

  const s3 = new S3Client({
    endpoint: ENDPOINT,
    region: REGION,
    credentials: { accessKeyId: ACCESS, secretAccessKey: SECRET },
    forcePathStyle: false,
  })

  return { s3, BUCKET, SSE_KEY, SSE_KEY_MD5 }
}

export async function uploadFile(
  buffer: Buffer,
  mimeType: string,
  folder: string
): Promise<{ storageKey: string; sizeBytes: number }> {
  const { s3, BUCKET, SSE_KEY, SSE_KEY_MD5 } = getConfig()
  const ext = mimeType.split("/")[1]?.split(";")[0] ?? "bin"
  const storageKey = `${folder}/${randomBytes(16).toString("hex")}.${ext}`

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
    Body: buffer,
    ContentType: mimeType,
    SSECustomerAlgorithm: "AES256",
    SSECustomerKey: SSE_KEY,
    SSECustomerKeyMD5: SSE_KEY_MD5,
  }))

  return { storageKey, sizeBytes: buffer.byteLength }
}

// Signerad nedladdnings-URL — giltig 15 minuter
export async function getDownloadUrl(storageKey: string): Promise<string> {
  const { s3, BUCKET, SSE_KEY, SSE_KEY_MD5 } = getConfig()
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: storageKey,
      SSECustomerAlgorithm: "AES256",
      SSECustomerKey: SSE_KEY,
      SSECustomerKeyMD5: SSE_KEY_MD5,
    }),
    { expiresIn: 900 }
  )
}

export async function deleteFile(storageKey: string): Promise<void> {
  const { s3, BUCKET } = getConfig()
  await s3.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
  }))
}
