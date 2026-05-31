import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { runPreMeetingAgent } from "@/lib/agents/pre-meeting-agent"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireCoach()
  const { id: sessionId } = await params

  try {
    await runPreMeetingAgent(sessionId)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Okänt fel"
    console.error("Pre-mötes-agent misslyckades:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
