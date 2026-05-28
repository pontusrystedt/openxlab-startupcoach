import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt } from "@/lib/crypto"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://startupcoach.openxlab.se"
const WEBHOOK_URL = `${APP_URL}/api/webhook/klang`

async function registerKlangWebhook(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  // Försök lista befintliga webhooks — Klang kanske inte stöder GET /resthooks
  try {
    const listRes = await fetch("https://app.klang.ai/api/v1/resthooks", {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (listRes.ok) {
      const existing = await listRes.json()
      const hooks: { hookUrl?: string; target?: string }[] = Array.isArray(existing)
        ? existing
        : existing.results ?? existing.data ?? []

      const alreadyRegistered = hooks.some(
        (h) => (h.hookUrl ?? h.target) === WEBHOOK_URL
      )
      if (alreadyRegistered) {
        return { ok: true }
      }
    }
    // Om GET ger 404/405 — hoppa direkt till registrering (try/ignore-mönster)
  } catch {
    // Nätverksfel — försök ändå registrera
  }

  // Registrera webhook
  try {
    const regRes = await fetch("https://app.klang.ai/api/v1/resthooks", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hookUrl: WEBHOOK_URL }),
    })

    if (regRes.ok) return { ok: true }
    if (regRes.status === 401) return { ok: false, error: "Ogiltig Klang API-nyckel" }
    if (regRes.status === 400) return { ok: false, error: "Ogiltig webhook-URL" }
    return { ok: false, error: `Klang svarade ${regRes.status}` }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

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
    const masked = "••••••••" + plain.slice(-6)
    return NextResponse.json({ configured: true, masked })
  } catch {
    return NextResponse.json({ configured: false })
  }
}

// POST – save / update API key + register webhook
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { apiKey } = await req.json()
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 8) {
    return NextResponse.json({ error: "Ogiltig API-nyckel" }, { status: 400 })
  }

  const key = apiKey.trim()

  // Registrera webhook hos Klang
  const webhook = await registerKlangWebhook(key)
  if (!webhook.ok) {
    return NextResponse.json(
      { error: webhook.error ?? "Kunde inte registrera webhook hos Klang" },
      { status: 400 }
    )
  }

  const encrypted = encrypt(key)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { klangApiKey: JSON.stringify(encrypted) },
  })

  return NextResponse.json({ ok: true, webhookRegistered: true })
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
