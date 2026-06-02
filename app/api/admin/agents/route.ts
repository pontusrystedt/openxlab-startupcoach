import { NextRequest, NextResponse } from "next/server"
import { requireClientAdmin } from "@/lib/access"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// Hämtar templates + org-specifik config för inloggad org
export async function GET() {
  const session = await requireClientAdmin()
  const orgId = session.user.orgId

  const templates = await prisma.agentTemplate.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      agentConfigs: {
        where: { orgId },
      },
    },
  })

  // Forma om: merge template med config så att frontend ser ett platt objekt
  const agents = templates.map((t) => {
    const config = t.agentConfigs[0] ?? null
    return {
      id:                  t.id,
      slug:                t.slug,
      name:                config?.displayName ?? t.name,
      title:               t.title,
      description:         t.description,
      bio:                 t.bio,
      personality:         t.personality,
      agentType:           t.agentType,
      processComponent:    t.processComponent,
      tier:                t.tier,
      availableFromTier:   t.availableFromTier,
      isActive:            config?.isActive ?? t.isActive,
      isSystemAgent:       t.isSystemAgent,
      sortOrder:           t.sortOrder,
      avatarStyle:         t.avatarStyle,
      avatarSeed:          t.avatarSeed,
      defaultCollections:  config?.assignedCollections?.length
                             ? config.assignedCollections
                             : t.defaultCollections,
      // Prompt: visa bara [CUSTOMIZABLE]-delen som redigerbar
      systemPromptOverride: config?.systemPromptOverride ?? "",
      // Låst del för display i UI
      systemPromptLocked:  extractLocked(t.systemPromptTemplate),
      // Config-id för PATCH
      configId:            config?.id ?? null,
    }
  })

  return NextResponse.json(agents)
}

// ClientAdmin skapar en ny subject-matter-agent för sin org
export async function POST(req: NextRequest) {
  const session = await requireClientAdmin()
  const orgId = session.user.orgId
  const data = await req.json()

  if (!data.slug || !data.name || !data.systemPrompt || !data.description) {
    return NextResponse.json({ error: "Obligatoriska fält saknas" }, { status: 400 })
  }

  const existing = await prisma.agentTemplate.findUnique({ where: { slug: data.slug } })
  if (existing) {
    return NextResponse.json({ error: "En agent med den sluggen finns redan" }, { status: 409 })
  }

  // Ny agent skapad av ClientAdmin lagras som AgentTemplate utan org-koppling
  // + en AgentConfig för den skapande orgen
  const template = await prisma.agentTemplate.create({
    data: {
      slug:                data.slug,
      name:                data.name,
      title:               data.title || null,
      description:         data.description,
      bio:                 data.bio || null,
      personality:         data.personality || null,
      // Wrap i LOCKED + tom CUSTOMIZABLE
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
      processComponent:    "COACHING", // default
      tier:                data.tier ?? "standard",
    },
  })

  // Skapa config för den skapande orgen
  const config = await prisma.agentConfig.create({
    data: {
      orgId,
      agentTemplateId:     template.id,
      displayName:         data.name,
      assignedCollections: data.defaultCollections ?? ["general"],
      isActive:            false, // startar på bänken
    },
  })

  return NextResponse.json({ ...template, configId: config.id })
}

function extractLocked(template: string): string {
  const match = template.match(/\[LOCKED\]([\s\S]*?)\[\/LOCKED\]/)
  return match ? match[1].trim() : template
}
