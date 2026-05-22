import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITHM = "aes-256-gcm"
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex")

export function encrypt(plaintext: string): {
  encryptedText: string
  iv: string
  authTag: string
} {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])

  return {
    encryptedText: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    authTag: cipher.getAuthTag().toString("hex"),
  }
}

export function decrypt(
  encryptedText: string,
  iv: string,
  authTag: string
): string {
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, "hex"))
  decipher.setAuthTag(Buffer.from(authTag, "hex"))

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "hex")),
    decipher.final(),
  ])

  return decrypted.toString("utf8")
}
