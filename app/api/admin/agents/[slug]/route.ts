import { NextRequest, NextResponse } from "next/server"
import { requireClientAdmin } from "@/lib/access"
import { prisma } from "@/lib/prisma"

const SUBJECT_MATTER_FIELDS = [
  "name", "title", "description", "bio", "personality",
  "systemPrompt", "knowledgeCollection", "trigger",
  "maxTokens", "avatarStyle", "avatarSeed", "sortOrder", "tier",
] as const

const PROCESS_FIELDS = [
  "name", "title", "description", "bio", "personality",
  "avatarStyle", "avatarSeed", "maxTokens",
] as const

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  await requireClientAdmin()
  const { slug } = await params

  const agent = await prisma.agentRegistry.findUnique({ where: { slug } })
  if (!agent) {
    return NextResponse.json({ error: "Agenten hittades inte" }, { status: 404 })
  }

  const data = await req.json()

  // Processagenter kan inte inaktiveras
  if (agent.agentType === "PROCESS" && "isActive" in data) {
    return NextResponse.json(
      { error: "Processagenter kan inte inaktiveras" },
      { status: 403 }
    )
  }

  const allowedFields =
    agent.agentType === "PROCESS" ? PROCESS_FIELDS : SUBJECT_MATTER_FIELDS

  const updateData: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in data) updateData[field] = data[field]
  }

  // Rensa tomma strängar → null för valfria fält
  for (const f of ["title", "bio", "personality", "avatarSeed"] as const) {
    if (updateData[f] === "") updateData[f] = null
  }

  const updated = await prisma.agentRegistry.update({
    where: { slug },
    data: updateData,
  })

  return NextResponse.json(updated)
}
