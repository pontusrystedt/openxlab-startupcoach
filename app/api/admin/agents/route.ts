import { NextRequest, NextResponse } from "next/server"
import { requireClientAdmin } from "@/lib/access"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await requireClientAdmin()

  const agents = await prisma.agentRegistry.findMany({
    orderBy: { sortOrder: "asc" },
  })

  return NextResponse.json(agents)
}

export async function POST(req: NextRequest) {
  await requireClientAdmin()
  const session = await auth()
  const data = await req.json()

  if (!data.slug || !data.name || !data.systemPrompt || !data.description) {
    return NextResponse.json({ error: "Obligatoriska fält saknas" }, { status: 400 })
  }

  const existing = await prisma.agentRegistry.findUnique({
    where: { slug: data.slug },
  })
  if (existing) {
    return NextResponse.json(
      { error: "En agent med den sluggen finns redan" },
      { status: 409 }
    )
  }

  const agent = await prisma.agentRegistry.create({
    data: {
      slug: data.slug,
      name: data.name,
      title: data.title || null,
      description: data.description,
      bio: data.bio || null,
      personality: data.personality || null,
      systemPrompt: data.systemPrompt,
      knowledgeCollection: data.knowledgeCollection ?? "general",
      trigger: data.trigger ?? "ON_DEMAND",
      maxTokens: data.maxTokens ?? 1000,
      avatarStyle: data.avatarStyle ?? "lorelei",
      avatarSeed: data.avatarSeed || null,
      isActive: false, // startar på bänken
      isSystemAgent: false,
      orgId: session?.user.orgId ?? null,
      createdBy: session?.user.id ?? null,
    },
  })

  return NextResponse.json(agent)
}
