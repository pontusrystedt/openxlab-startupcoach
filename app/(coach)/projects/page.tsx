import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function ProjectsPage() {
  const session = await requireCoach()

  const projects = await prisma.funderProject.findMany({
    where: { orgId: session.user.orgId! },
    orderBy: { createdAt: "desc" },
    include: { startups: { include: { startup: { select: { id: true, name: true } } } } },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Finansiärsprojekt</h1>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-sm">Inga projekt registrerade ännu.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-medium text-gray-900">{project.name}</h2>
                  <p className="text-sm text-gray-500">{project.funderName}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(project.periodStart).toLocaleDateString("sv-SE")} –{" "}
                    {new Date(project.periodEnd).toLocaleDateString("sv-SE")}
                  </p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                  {project.startups.length} startups
                </span>
              </div>
              {project.startups.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {project.startups.map(({ startup }) => (
                    <Link
                      key={startup.id}
                      href={`/startups/${startup.id}`}
                      className="text-xs bg-[#1D9E75]/10 text-[#1D9E75] px-2 py-0.5 rounded-full hover:bg-[#1D9E75]/20"
                    >
                      {startup.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
