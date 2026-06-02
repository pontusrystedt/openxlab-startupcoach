import { NextRequest, NextResponse } from "next/server"
import { requireClientAdmin } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await requireClientAdmin()
  const orgId = session.user.orgId
  const { slug } = await params

  if (!orgId) {
    return NextResponse.json({ error: "Ingen organisation kopplad" }, { status: 403 })
  }

  const template = await prisma.agentTemplate.findUnique({
    where: { slug },
    include: { agentConfigs: { where: { orgId } } },
  })
  if (!template) {
    return NextResponse.json({ error: "Agenten hittades inte" }, { status: 404 })
  }

  if (template.agentType === "PROCESS") {
    return NextResponse.json({ error: "Processagenter kan inte inaktiveras" }, { status: 403 })
  }
  if (template.isSystemAgent) {
    return NextResponse.json({ error: "Systemagenter kan inte inaktiveras" }, { status: 403 })
  }

  const config = template.agentConfigs[0]
  if (!config) {
    return NextResponse.json({ error: "Ingen konfiguration hittades för denna org" }, { status: 404 })
  }

  const updated = await prisma.agentConfig.update({
    where: { id: config.id },
    data: { isActive: !config.isActive },
  })

  return NextResponse.json(updated)
}
