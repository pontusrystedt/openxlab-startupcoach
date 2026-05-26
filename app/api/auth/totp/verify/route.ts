import * as OTPAuth from "otpauth"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { decrypt } from "@/lib/crypto"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await req.json()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { totpSecret: true, totpEnabled: true },
  })

  if (!user?.totpEnabled || !user.totpSecret) {
    return NextResponse.json({ error: "TOTP not enabled" }, { status: 400 })
  }

  const secretData = JSON.parse(user.totpSecret)
  const secretRaw = decrypt(secretData.encryptedText, secretData.iv, secretData.authTag)

  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secretRaw),
    digits: 6,
    period: 30,
  })

  const delta = totp.validate({ token: code, window: 1 })

  if (delta === null) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpVerifiedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
