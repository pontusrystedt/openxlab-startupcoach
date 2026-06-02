export const dynamic = "force-dynamic"

import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import AgenterPageClient from "@/components/agents/AgenterPageClient"

function serializeAgent(a: {
  id: string; slug: string; name: string; title: string | null
  description: string; bio: string | null; avatarStyle: string
  avatarSeed: string | null; isActive: boolean; isSystemAgent: boolean
  agentType: string; tier: string; sortOrder: number
}) {
  return {
    id: a.id, slug: a.slug, name: a.name, title: a.title,
    description: a.description, bio: a.bio, avatarStyle: a.avatarStyle,
    avatarSeed: a.avatarSeed, isActive: a.isActive, isSystemAgent: a.isSystemAgent,
    agentType: a.agentType as "PROCESS" | "SUBJECT_MATTER",
    tier: a.tier, sortOrder: a.sortOrder,
  }
}

export default async function AgenterPage() {
  const session = await requireCoach()
  const orgId = session.user.orgId

  const [templates, org] = await Promise.all([
    prisma.agentTemplate.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        agentConfigs: orgId
          ? { where: { orgId, isActive: true } }
          : false,
      },
    }),
    orgId
      ? prisma.organization.findUnique({
          where: { id: orgId },
          select: { agentTiers: true },
        })
      : null,
  ])

  const orgTiers = org?.agentTiers ?? ["standard"]
  const isCoachOrAdmin = ["COACH", "CLIENT_ADMIN", "SYSTEM_ADMIN"].includes(session.user.role)

  // Merge template med org-specifik config
  const allAgents = templates.map((t) => {
    const config = Array.isArray(t.agentConfigs) ? t.agentConfigs[0] ?? null : null
    return {
      ...t,
      name: config?.displayName ?? t.name,
      isActive: config?.isActive ?? t.isActive,
    }
  })

  return (
    <AgenterPageClient
      processAgents={allAgents.filter((a) => a.agentType === "PROCESS").map(serializeAgent)}
      subjectAgents={allAgents.filter((a) => a.agentType === "SUBJECT_MATTER" && a.tier === "standard").map(serializeAgent)}
      premiumAgents={allAgents.filter((a) => a.agentType === "SUBJECT_MATTER" && a.tier !== "standard").map(serializeAgent)}
      orgTiers={orgTiers}
      isCoachOrAdmin={isCoachOrAdmin}
    />
  )
}
