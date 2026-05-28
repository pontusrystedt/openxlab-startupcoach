import { prisma } from "@/lib/prisma"
import { requireCoach } from "@/lib/access"
import Link from "next/link"
import { notFound } from "next/navigation"
import NewSessionForm from "./NewSessionForm"
import SessionsTable from "./SessionsTable"

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
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">Möten</h1>
        </div>
        <NewSessionForm startupId={id} nextNumber={startup.sessions.length + 1} />
      </div>

      <SessionsTable
        startupId={id}
        sessions={startup.sessions.map((s) => ({
          ...s,
          scheduledAt: s.scheduledAt.toISOString(),
        }))}
      />
    </div>
  )
}
