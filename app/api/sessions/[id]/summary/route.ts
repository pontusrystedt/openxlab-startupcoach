import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEntrepreneur } from "@/lib/access"
import { decrypt } from "@/lib/crypto"
import { auth } from "@/auth"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userSession = await auth()
  if (!userSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const session = await prisma.session.findUnique({
    where: { id },
    include: { summary: true },
  })

  if (!session) return NextResponse.json({ error: "Hittades inte" }, { status: 404 })
  await requireEntrepreneur(session.startupId)

  if (!session.summary) return NextResponse.json({ summary: null })

  const data = JSON.parse(
    decrypt(session.summary.encryptedData, session.summary.iv, session.summary.authTag)
  )

  return NextResponse.json({ id: session.summary.id, createdAt: session.summary.createdAt, ...data })
}
