import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

const PHASE_LABEL: Record<string, string> = {
  COACHING: "Coaching",
  SOCIAL: "Social",
  IRL_CHECK: "IRL-check",
  PRIORITIZATION: "Prioritering",
  CLOSING: "Avslutning",
}

export default async function EntrepreneurSessionsPage() {
  const session = await auth()
  if (!session?.user.startupId) redirect("/login")

  const sessions = await prisma.session.findMany({
    where: { startupId: session.user.startupId },
    orderBy: { sessionNumber: "desc" },
    include: {
      summary: true,
      _count: { select: { todos: true } },
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Möten</h1>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-sm">Inga möten ännu.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Datum</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Fas</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Todos</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Sammanfattning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/my/sessions/${s.id}`} className="text-[#1D9E75] hover:underline font-medium">
                      #{s.sessionNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(s.scheduledAt).toLocaleDateString("sv-SE")}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {PHASE_LABEL[s.phase] ?? s.phase}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s._count.todos}</td>
                  <td className="px-4 py-3">
                    {s.summary
                      ? <span className="text-xs text-green-600">Klar</span>
                      : <span className="text-xs text-gray-400">–</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
