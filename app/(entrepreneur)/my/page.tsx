import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/access"
import { auth } from "@/auth"
import Link from "next/link"
import { IrlRadar } from "@/components/IrlRadar"
import { redirect } from "next/navigation"

export default async function EntrepreneurDashboard() {
  await requireAuth()
  const session = await auth()
  if (!session?.user.startupId) redirect("/login")

  const startupId = session.user.startupId

  const startup = await prisma.startup.findUnique({
    where: { id: startupId },
    include: {
      irlProfiles: { orderBy: { createdAt: "desc" }, take: 2 },
      sessions: {
        orderBy: { scheduledAt: "desc" },
        take: 3,
        include: {
          todos: {
            where: { completedAt: null },
            orderBy: { priority: "asc" },
            take: 5,
          },
        },
      },
    },
  })

  if (!startup) redirect("/login")

  const [currentIrl, previousIrl] = startup.irlProfiles
  const pendingTodos = startup.sessions.flatMap((s) => s.todos).slice(0, 5)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">{startup.name}</h1>

      <div className="grid grid-cols-2 gap-4">
        {/* Aktiva todos */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-gray-900">Aktuella todos</h2>
            <Link href="/my/todos" className="text-xs text-[#1D9E75] hover:underline">
              Alla →
            </Link>
          </div>
          {pendingTodos.length > 0 ? (
            <ol className="space-y-2">
              {pendingTodos.map((todo) => (
                <li key={todo.id} className="flex items-start gap-2 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1D9E75] text-white text-xs flex items-center justify-center">
                    {todo.priority}
                  </span>
                  <span className="text-gray-700">{todo.text}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-gray-400">Inga aktiva todos</p>
          )}
        </div>

        {/* IRL */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-gray-900">IRL-profil</h2>
            <Link href="/my/irl" className="text-xs text-[#1D9E75] hover:underline">
              Detaljer →
            </Link>
          </div>
          {currentIrl ? (
            <IrlRadar current={currentIrl} previous={previousIrl} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              Ingen IRL-profil ännu
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
