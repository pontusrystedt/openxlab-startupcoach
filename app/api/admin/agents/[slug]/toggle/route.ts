import { NextRequest, NextResponse } from "next/server"
import { requireClientAdmin } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  await requireClientAdmin()
  const { slug } = await params

  const agent = await prisma.agentRegistry.findUnique({ where: { slug } })
  if (!agent) {
    return NextResponse.json({ error: "Agenten hittades inte" }, { status: 404 })
  }

  if (agent.isSystemAgent) {
    return NextResponse.json(
      { error: "Systemagenter kan inte inaktiveras" },
      { status: 403 }
    )
  }

  const updated = await prisma.agentRegistry.update({
    where: { slug },
    data: { isActive: !agent.isActive },
  })

  return NextResponse.json(updated)
}
