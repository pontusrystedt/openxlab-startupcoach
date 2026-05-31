"use client"

import { AgentCard } from "./AgentCard"

interface Agent {
  id: string
  slug: string
  name: string
  title: string | null
  description: string
  bio: string | null
  avatarStyle: string
  avatarSeed: string | null
  isActive: boolean
  isSystemAgent: boolean
  agentType: "PROCESS" | "SUBJECT_MATTER"
  tier: string
  sortOrder: number
}

interface Props {
  processAgents: Agent[]
  subjectAgents: Agent[]
  premiumAgents: Agent[]
  orgTiers: string[]
  isCoachOrAdmin: boolean
}

export default function AgenterPageClient({
  processAgents,
  subjectAgents,
  premiumAgents,
  orgTiers,
  isCoachOrAdmin,
}: Props) {
  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isCoachOrAdmin ? "Agenter" : "Dina AI-specialister"}
        </h1>
        {!isCoachOrAdmin && (
          <p className="text-sm text-gray-500 mt-1">
            Dessa AI-specialister kan kallas in av din coach under och efter möten
            för att ge dig expertråd inom specifika områden.
          </p>
        )}
      </div>

      {/* Processagenter */}
      {processAgents.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Processagenter</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Körs automatiskt som en del av coachingprocessen.
            </p>
          </div>
          {processAgents.map((agent) => (
            <AgentCard
              key={agent.slug}
              agent={agent}
              showBio
            />
          ))}
        </section>
      )}

      {/* Specialistagenter */}
      {subjectAgents.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Specialistagenter</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Kallas in av coach vid behov under eller efter möten.
            </p>
          </div>
          {subjectAgents.map((agent) => (
            <AgentCard
              key={agent.slug}
              agent={agent}
              showBio
            />
          ))}
        </section>
      )}

      {/* Premium-agenter */}
      {premiumAgents.length > 0 && (
        <section className="space-y-3">
          <div className="mt-2 mb-1">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
              Premium-agenter
            </h3>
          </div>
          {premiumAgents.map((agent) => {
            const isPremiumLocked =
              agent.tier === "premium" && !orgTiers.includes("premium")
            return (
              <AgentCard
                key={agent.slug}
                agent={agent}
                showBio
                isPremiumLocked={isPremiumLocked}
              />
            )
          })}
        </section>
      )}
    </div>
  )
}
