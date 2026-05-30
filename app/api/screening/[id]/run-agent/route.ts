import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { runScreeningAgent } from "@/lib/agents/screening-agent"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCoach()
  const { id } = await params

  const body = await req.json().catch(() => ({}))
  const { programId } = body as { programId?: string }

  const startup = await prisma.startup.findUnique({
    where: { id },
    select: {
      orgId: true,
      screeningTranscriptEncrypted: true,
    },
  })

  if (!startup || startup.orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Startup hittades inte" }, { status: 404 })
  }

  if (!startup.screeningTranscriptEncrypted) {
    return NextResponse.json(
      { error: "Inget screeningtranskript tillgängligt" },
      { status: 400 }
    )
  }

  // Kör agenten asynkront
  runScreeningAgent(id, programId).catch((err) =>
    console.error("Screening agent misslyckades:", err)
  )

  return NextResponse.json({ started: true })
}
