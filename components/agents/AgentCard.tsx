import { AgentAvatar } from "./AgentAvatar"

interface Agent {
  slug: string
  name: string
  title?: string | null
  bio?: string | null
  description: string
  isActive: boolean
  avatarStyle?: string | null
  avatarSeed?: string | null
  isSystemAgent: boolean
  tier?: string | null
}

interface Props {
  agent: Agent
  showBio?: boolean
  isPremiumLocked?: boolean
  onToggle?: () => void
  onEdit?: () => void
  onSelect?: () => void
  selected?: boolean
}

export function AgentCard({
  agent,
  showBio = false,
  isPremiumLocked = false,
  onToggle,
  onEdit,
  onSelect,
  selected,
}: Props) {
  return (
    <div
      onClick={isPremiumLocked ? undefined : onSelect}
      className={`relative border rounded-xl p-4 transition-all ${
        onSelect && !isPremiumLocked ? "cursor-pointer hover:border-gray-300" : ""
      } ${selected ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white"} ${
        isPremiumLocked ? "opacity-50" : !agent.isActive ? "opacity-60" : ""
      }`}
    >
      {/* Premium-badge overlay */}
      {isPremiumLocked && (
        <div className="absolute top-2 right-2">
          <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-medium border border-amber-300">
            ✦ Premium
          </span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <AgentAvatar
          slug={agent.slug}
          avatarStyle={agent.avatarStyle ?? "lorelei"}
          avatarSeed={agent.avatarSeed ?? undefined}
          size={48}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 text-sm">{agent.name}</span>
            {!isPremiumLocked && !agent.isActive && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                På bänken
              </span>
            )}
            {!isPremiumLocked && agent.tier && agent.tier !== "standard" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                {agent.tier === "premium" ? "Premium" : agent.tier}
              </span>
            )}
          </div>
          {agent.title && (
            <div className="text-xs text-gray-500 mt-0.5">{agent.title}</div>
          )}
          <div className="text-xs text-gray-600 mt-1 leading-relaxed">
            {agent.description}
          </div>
          {showBio && agent.bio && (
            <div className="text-xs text-gray-500 mt-2 leading-relaxed border-t border-gray-100 pt-2">
              {agent.bio}
            </div>
          )}
        </div>
      </div>

      {/* Premium-locked footer */}
      {isPremiumLocked && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">
            Inte tillgänglig på ditt nuvarande abonnemang.
          </p>
          <a
            href="mailto:hello@openxlab.se?subject=Premium-agenter"
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 inline-block"
          >
            Kontakta oss för åtkomst →
          </a>
        </div>
      )}

      {/* Normal action buttons */}
      {!isPremiumLocked && (onToggle || onEdit) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Redigera
            </button>
          )}
          {onToggle && !agent.isSystemAgent && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggle() }}
              className={`text-xs px-3 py-1.5 rounded-lg border ${
                agent.isActive
                  ? "border-gray-200 text-gray-500 hover:bg-gray-50"
                  : "border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
              }`}
            >
              {agent.isActive ? "Lägg på bänken" : "Aktivera"}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
