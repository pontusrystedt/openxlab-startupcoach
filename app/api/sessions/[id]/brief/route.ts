import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireCoach()
  const { id } = await params

  const session = await prisma.session.findUnique({
    where: { id },
    select: {
      encryptedBrief: true,
      briefIv: true,
      briefAuthTag: true,
      briefGeneratedAt: true,
    },
  })

  if (!session?.encryptedBrief) {
    return NextResponse.json({ brief: null })
  }

  try {
    const raw = decrypt(session.encryptedBrief, session.briefIv!, session.briefAuthTag!)
    return NextResponse.json({ brief: JSON.parse(raw) })
  } catch {
    return NextResponse.json({ brief: null, error: "Dekryptering misslyckades" })
  }
}
