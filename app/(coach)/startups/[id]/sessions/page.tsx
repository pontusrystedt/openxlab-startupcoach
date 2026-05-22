import { prisma } from "@/lib/prisma"
import { requireCoach } from "@/lib/access"
import Link from "next/link"
import { notFound } from "next/navigation"
import NewSessionForm from "./NewSessionForm"

export default async function SessionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireCoach()
  const { id } = await params

  const startup = await prisma.startup.findUnique({
    where: { id },
    include: {
      sessions: {
        orderBy: { sessionNumber: "desc" },
        include: { summary: true, _count: { select: { todos: true } } },
      },
    },
  })

  if (!startup) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/startups/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
            ← {startup.name}
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">Sessions</h1>
        </div>
        <NewSessionForm startupId={id} nextNumber={startup.sessions.length + 1} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Datum</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Fas</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Todos</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {startup.sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/startups/${id}/sessions/${session.id}`}
                    className="text-[#1D9E75] hover:underline font-medium"
                  >
                    #{session.sessionNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(session.scheduledAt).toLocaleDateString("sv-SE")}
                </td>
                <td className="px-4 py-3 text-gray-600">{session.phase}</td>
                <td className="px-4 py-3 text-gray-600">{session._count.todos}</td>
                <td className="px-4 py-3">
                  {session.summary ? (
                    <span className="text-green-600 text-xs">Klar</span>
                  ) : (
                    <span className="text-gray-400 text-xs">Inväntar transkript</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {startup.sessions.length === 0 && (
          <p className="text-center py-10 text-gray-400">Inga sessions ännu</p>
        )}
      </div>
    </div>
  )
}
