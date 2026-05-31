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

  const [allAgents, org] = await Promise.all([
    prisma.agentRegistry.findMany({ orderBy: { sortOrder: "asc" } }),
    session.user.orgId
      ? prisma.organization.findUnique({
          where: { id: session.user.orgId },
          select: { agentTiers: true },
        })
      : null,
  ])

  const orgTiers = org?.agentTiers ?? ["standard"]
  const isCoachOrAdmin = ["COACH", "CLIENT_ADMIN", "SYSTEM_ADMIN"].includes(session.user.role)

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
