import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { deleteFile } from "@/lib/storage"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await requireCoach()
  const { id: startupId, fileId } = await params

  const startup = await prisma.startup.findFirst({
    where: { id: startupId, orgId: session.user.orgId! },
  })
  if (!startup) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const file = await prisma.startupFile.findFirst({
    where: { id: fileId, startupId },
  })
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (file.storageKey) {
    try { await deleteFile(file.storageKey) } catch { /* fortsätt om S3-radering misslyckas */ }
  }
  await prisma.startupFile.delete({ where: { id: fileId } })

  return NextResponse.json({ ok: true })
}
