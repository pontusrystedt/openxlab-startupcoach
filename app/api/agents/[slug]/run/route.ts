import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { runAgent } from "@/lib/agents/agent-runner"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await requireCoach()
  const { slug } = await params
  const { startupId, userMessage, sessionId, meetingId } = await req.json()

  if (!startupId || !userMessage) {
    return NextResponse.json(
      { error: "startupId och userMessage krävs" },
      { status: 400 }
    )
  }

  try {
    const result = await runAgent({
      agentSlug: slug,
      startupId,
      orgId: session.user.orgId,
      userMessage,
      sessionId,
      meetingId,
      trigger: "manual",
      encryptOutput: false,
    })
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Okänt fel"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
