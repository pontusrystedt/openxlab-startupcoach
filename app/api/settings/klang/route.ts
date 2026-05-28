import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt } from "@/lib/crypto"

// GET – check if API key is configured (returns masked key)
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { klangApiKey: true },
  })

  if (!user?.klangApiKey) {
    return NextResponse.json({ configured: false })
  }

  try {
    const stored = JSON.parse(user.klangApiKey) as { encryptedText: string; iv: string; authTag: string }
    const plain = decrypt(stored.encryptedText, stored.iv, stored.authTag)
    // Return masked key: show last 6 chars
    const masked = "••••••••" + plain.slice(-6)
    return NextResponse.json({ configured: true, masked })
  } catch {
    return NextResponse.json({ configured: false })
  }
}

// POST – save / update API key
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { apiKey } = await req.json()
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 8) {
    return NextResponse.json({ error: "Ogiltig API-nyckel" }, { status: 400 })
  }

  const encrypted = encrypt(apiKey.trim())

  await prisma.user.update({
    where: { id: session.user.id },
    data: { klangApiKey: JSON.stringify(encrypted) },
  })

  return NextResponse.json({ ok: true })
}

// DELETE – remove API key
export async function DELETE() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.user.update({
    where: { id: session.user.id },
    data: { klangApiKey: null },
  })

  return NextResponse.json({ ok: true })
}
