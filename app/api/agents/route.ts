import { NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { getAvailableAgents } from "@/lib/agents/agent-runner"

export async function GET() {
  const session = await requireCoach()
  const agents = await getAvailableAgents(session.user.orgId)
  return NextResponse.json(agents)
}
