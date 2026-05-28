import { prisma } from "@/lib/prisma"
import { requireCoach } from "@/lib/access"
import { notFound } from "next/navigation"
import Link from "next/link"
import ProjectSections from "./ProjectSections"

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireCoach()
  const { id } = await params

  const project = await prisma.funderProject.findUnique({
    where: { id },
    include: {
      startups: { include: { startup: { select: { id: true, name: true } } } },
      meetings: {
        orderBy: { meetingNumber: "desc" },
        include: { todos: { orderBy: { priority: "asc" } } },
      },
      todos: { orderBy: [{ priority: "asc" }, { createdAt: "asc" }] },
    },
  })

  if (!project) notFound()

  const allStartups = await prisma.startup.findMany({
    where: { orgId: project.orgId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <Link href="/projects" className="text-sm text-gray-500 hover:text-gray-700">
          ← Projekt
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-1">{project.name}</h1>
        <p className="text-sm text-gray-500">
          {project.funderName} · {new Date(project.periodStart).toLocaleDateString("sv-SE")} – {new Date(project.periodEnd).toLocaleDateString("sv-SE")}
        </p>
        {project.requirementText && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mt-2">
            {project.requirementText}
          </p>
        )}
      </div>

      <ProjectSections
        project={{
          id: project.id,
          orgId: project.orgId,
          startups: project.startups.map((s) => ({ startup: s.startup })),
          meetings: project.meetings.map((m) => ({
            ...m,
            scheduledAt: m.scheduledAt.toISOString(),
            createdAt: m.createdAt.toISOString(),
            todos: m.todos.map((t) => ({
              ...t,
              dueDate: t.dueDate?.toISOString() ?? null,
              createdAt: t.createdAt.toISOString(),
            })),
          })),
          todos: project.todos.map((t) => ({
            ...t,
            dueDate: t.dueDate?.toISOString() ?? null,
            createdAt: t.createdAt.toISOString(),
          })),
        }}
        allStartups={allStartups}
      />
    </div>
  )
}
