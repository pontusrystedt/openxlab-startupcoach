import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { deleteFile } from "@/lib/storage"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCoach()
  const { id } = await params

  if (!session.user.orgId) return NextResponse.json({ error: "Ingen organisation" }, { status: 403 })

  const item = await prisma.knowledgeItem.findFirst({
    where: { id, orgId: session.user.orgId! },
  })
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (item.storageKey) {
    try { await deleteFile(item.storageKey) } catch { /* fortsätt */ }
  }

  await prisma.knowledgeItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCoach()
  const { id } = await params

  if (!session.user.orgId) return NextResponse.json({ error: "Ingen organisation" }, { status: 403 })

  const item = await prisma.knowledgeItem.findFirst({
    where: { id, orgId: session.user.orgId! },
  })
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { collections } = await req.json()
  if (!Array.isArray(collections)) {
    return NextResponse.json({ error: "collections måste vara en array" }, { status: 400 })
  }

  const updated = await prisma.knowledgeItem.update({
    where: { id },
    data: { collections },
  })

  return NextResponse.json(updated)
}
