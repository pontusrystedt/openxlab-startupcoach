import { NextRequest, NextResponse } from "next/server"
import { requireClientAdmin } from "@/lib/access"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await requireClientAdmin()
  const orgId = session.user.orgId

  if (!orgId) {
    return NextResponse.json({ error: "Ingen organisation kopplad" }, { status: 403 })
  }

  const templates = await prisma.agentTemplate.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      agentConfigs: {
        where: { orgId },
      },
    },
  })

  const agents = templates.map((t) => {
    const config = t.agentConfigs[0] ?? null
    return {
      id:                   t.id,
      slug:                 t.slug,
      name:                 config?.displayName ?? t.name,
      title:                t.title,
      description:          t.description,
      bio:                  t.bio,
      personality:          t.personality,
      agentType:            t.agentType,
      processComponent:     t.processComponent,
      tier:                 t.tier,
      availableFromTier:    t.availableFromTier,
      isActive:             config?.isActive ?? t.isActive,
      isSystemAgent:        t.isSystemAgent,
      sortOrder:            t.sortOrder,
      avatarStyle:          t.avatarStyle,
      avatarSeed:           t.avatarSeed,
      defaultCollections:   config?.assignedCollections?.length
                              ? config.assignedCollections
                              : t.defaultCollections,
      systemPromptOverride: config?.systemPromptOverride ?? "",
      systemPromptLocked:   extractLocked(t.systemPromptTemplate),
      configId:             config?.id ?? null,
    }
  })

  return NextResponse.json(agents)
}

export async function POST(req: NextRequest) {
  const session = await requireClientAdmin()
  const orgId = session.user.orgId

  if (!orgId) {
    return NextResponse.json({ error: "Ingen organisation kopplad" }, { status: 403 })
  }

  const data = await req.json()

  if (!data.slug || !data.name || !data.systemPrompt || !data.description) {
    return NextResponse.json({ error: "Obligatoriska fält saknas" }, { status: 400 })
  }

  const existing = await prisma.agentTemplate.findUnique({ where: { slug: data.slug } })
  if (existing) {
    return NextResponse.json({ error: "En agent med den sluggen finns redan" }, { status: 409 })
  }

  const template = await prisma.agentTemplate.create({
    data: {
      slug:                data.slug,
      name:                data.name,
      title:               data.title || null,
      description:         data.description,
      bio:                 data.bio || null,
      personality:         data.personality || null,
      systemPromptTemplate:
        `[LOCKED]\n${data.systemPrompt}\n[/LOCKED]\n\n[CUSTOMIZABLE]\n[/CUSTOMIZABLE]`,
      knowledgeCollection: data.knowledgeCollection ?? "general",
      defaultCollections:  data.defaultCollections ?? ["general"],
      trigger:             data.trigger ?? "ON_DEMAND",
      maxTokens:           data.maxTokens ?? 1000,
      avatarStyle:         data.avatarStyle ?? "lorelei",
      avatarSeed:          data.avatarSeed || null,
      isActive:            true,
      isSystemAgent:       false,
      agentType:           "SUBJECT_MATTER",
      processComponent:    "COACHING",
      tier:                data.tier ?? "standard",
    },
  })

  const config = await prisma.agentConfig.create({
    data: {
      orgId,
      agentTemplateId:     template.id,
      displayName:         data.name,
      assignedCollections: data.defaultCollections ?? ["general"],
      isActive:            false,
    },
  })

  return NextResponse.json({ ...template, configId: config.id })
}

function extractLocked(template: string): string {
  const match = template.match(/\[LOCKED\]([\s\S]*?)\[\/LOCKED\]/)
  return match ? match[1].trim() : template
}
