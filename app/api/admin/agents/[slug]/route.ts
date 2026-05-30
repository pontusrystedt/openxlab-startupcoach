import { NextRequest, NextResponse } from "next/server"
import { requireClientAdmin } from "@/lib/access"
import { prisma } from "@/lib/prisma"

const ALLOWED_FIELDS = [
  "name",
  "title",
  "description",
  "bio",
  "personality",
  "systemPrompt",
  "knowledgeCollection",
  "trigger",
  "maxTokens",
  "avatarStyle",
  "avatarSeed",
  "sortOrder",
] as const

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  await requireClientAdmin()
  const { slug } = await params
  const data = await req.json()

  const updateData: Record<string, unknown> = {}
  for (const field of ALLOWED_FIELDS) {
    if (field in data) updateData[field] = data[field]
  }

  // Rensa tomma strängar → null för valfria fält
  for (const f of ["title", "bio", "personality", "avatarSeed"] as const) {
    if (updateData[f] === "") updateData[f] = null
  }

  const agent = await prisma.agentRegistry.update({
    where: { slug },
    data: updateData,
  })

  return NextResponse.json(agent)
}
