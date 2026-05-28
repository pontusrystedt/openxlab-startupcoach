import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Hämta användarens krypterade Klang-nyckel
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { klangApiKey: true },
  })

  let apiKey: string | null = null

  if (user?.klangApiKey) {
    try {
      const stored = JSON.parse(user.klangApiKey) as { encryptedText: string; iv: string; authTag: string }
      apiKey = decrypt(stored.encryptedText, stored.iv, stored.authTag)
    } catch {
      return NextResponse.json({ error: "Kunde inte läsa Klang-nyckel" }, { status: 500 })
    }
  }

  // Fallback till global env-variabel (bakåtkompatibilitet)
  if (!apiKey) apiKey = process.env.KLANG_API_KEY ?? null

  if (!apiKey) {
    return NextResponse.json(
      { error: "Ingen Klang API-nyckel konfigurerad. Gå till Klang.ai-inställningarna." },
      { status: 400 }
    )
  }

  const res = await fetch("https://app.klang.ai/api/v1/conversations", {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!res.ok) {
    return NextResponse.json({ error: "Klang API-fel", status: res.status }, { status: 502 })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
