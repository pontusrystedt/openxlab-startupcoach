import { randomBytes } from "crypto"
import { prisma } from "./prisma"

export function generateToken(): string {
  return randomBytes(32).toString("hex")
}

export async function createEmailVerifyToken(userId: string): Promise<string> {
  const token = generateToken()
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerifyToken: token },
  })
  return token
}
