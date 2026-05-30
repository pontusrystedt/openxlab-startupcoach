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
}

interface Props {
  agent: Agent
  showBio?: boolean
  onToggle?: () => void
  onEdit?: () => void
  onSelect?: () => void
  selected?: boolean
}

export function AgentCard({
  agent,
  showBio = false,
  onToggle,
  onEdit,
  onSelect,
  selected,
}: Props) {
  return (
    <div
      onClick={onSelect}
      className={`border rounded-xl p-4 transition-all ${
        onSelect ? "cursor-pointer hover:border-gray-300" : ""
      } ${selected ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white"} ${
        !agent.isActive ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <AgentAvatar
          slug={agent.slug}
          avatarStyle={agent.avatarStyle ?? "lorelei"}
          avatarSeed={agent.avatarSeed ?? undefined}
          size={48}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 text-sm">{agent.name}</span>
            {!agent.isActive && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                På bänken
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

      {(onToggle || onEdit) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Redigera
            </button>
          )}
          {onToggle && !agent.isSystemAgent && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggle()
              }}
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
