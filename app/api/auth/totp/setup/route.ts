import * as OTPAuth from "otpauth"
import QRCode from "qrcode"
import { encrypt, decrypt } from "@/lib/crypto"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { action, code } = await req.json()

  if (action === "init") {
    const secret = new OTPAuth.Secret()
    const totp = new OTPAuth.TOTP({
      issuer: "OpenX Lab Startupcoach",
      label: session.user.email,
      secret,
      digits: 6,
      period: 30,
    })

    const uri = totp.toString()
    const qrDataUrl = await QRCode.toDataURL(uri)

    const encrypted = encrypt(secret.base32)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totpSecret: JSON.stringify(encrypted),
        totpEnabled: false,
      },
    })

    return NextResponse.json({ qrDataUrl, secret: secret.base32 })
  }

  if (action === "confirm") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { totpSecret: true },
    })
    if (!user?.totpSecret) {
      return NextResponse.json({ error: "No pending setup" }, { status: 400 })
    }

    const secretData = JSON.parse(user.totpSecret)
    const secretRaw = decrypt(secretData.encryptedText, secretData.iv, secretData.authTag)

    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secretRaw),
      digits: 6,
      period: 30,
    })

    if (totp.validate({ token: code, window: 1 }) === null) {
      return NextResponse.json({ error: "Invalid code" }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { totpEnabled: true, totpVerifiedAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  }

  if (action === "disable") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { totpEnabled: false, totpSecret: null },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
