import { NextRequest, NextResponse } from "next/server"
import { requireClientAdmin } from "@/lib/access"
import { prisma } from "@/lib/prisma"

// Fält som ClientAdmin får ändra på SUBJECT_MATTER-agenter (via AgentConfig)
const CONFIG_FIELDS = [
  "displayName", "systemPromptOverride", "assignedCollections", "isActive",
] as const

// Fält som ClientAdmin får ändra på PROCESS-agenter (begränsat)
const PROCESS_CONFIG_FIELDS = [
  "displayName", "systemPromptOverride",
] as const

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await requireClientAdmin()
  const orgId = session.user.orgId
  const { slug } = await params

  const template = await prisma.agentTemplate.findUnique({
    where: { slug },
    include: { agentConfigs: { where: { orgId } } },
  })
  if (!template) {
    return NextResponse.json({ error: "Agenten hittades inte" }, { status: 404 })
  }

  const data = await req.json()

  // Processagenter kan inte inaktiveras
  if (template.agentType === "PROCESS" && "isActive" in data && data.isActive === false) {
    return NextResponse.json(
      { error: "Processagenter kan inte inaktiveras" },
      { status: 403 }
    )
  }

  const allowedFields =
    template.agentType === "PROCESS" ? PROCESS_CONFIG_FIELDS : CONFIG_FIELDS

  const updateData: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in data) updateData[field] = data[field]
  }
  if (updateData["displayName"] === "") updateData["displayName"] = template.name

  const config = template.agentConfigs[0]

  if (config) {
    const updated = await prisma.agentConfig.update({
      where: { id: config.id },
      data: updateData,
    })
    return NextResponse.json(updated)
  } else {
    // Skapa config om den inte finns än
    const created = await prisma.agentConfig.create({
      data: {
        orgId,
        agentTemplateId: template.id,
        displayName: (updateData["displayName"] as string) ?? template.name,
        systemPromptOverride: updateData["systemPromptOverride"] as string | undefined,
        assignedCollections: (updateData["assignedCollections"] as string[]) ?? template.defaultCollections,
        isActive: (updateData["isActive"] as boolean) ?? true,
      },
    })
    return NextResponse.json(created)
  }
}
