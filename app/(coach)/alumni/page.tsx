import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function AlumniPage() {
  const session = await requireCoach()

  const startups = await prisma.startup.findMany({
    where: {
      status: "ALUMNI",
      ...(session.user.orgId ? { orgId: session.user.orgId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      irlProfiles: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { sessions: true } },
      program: { select: { name: true } },
      funderProjects: {
        include: { project: { select: { name: true, funderName: true } } },
      },
    },
  })

  const IRL_DIMS = ["crl", "trl", "brl", "iprl", "frl", "orl"]

  function avgIrl(profile: Record<string, unknown> | null) {
    if (!profile) return null
    const vals = IRL_DIMS.map((d) => (typeof profile[d] === "number" ? (profile[d] as number) : 0))
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Alumni</h1>
        <p className="text-gray-500 text-sm">
          {startups.length} startup{startups.length !== 1 ? "s" : ""} har genomfört coaching
        </p>
      </div>

      {startups.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-sm">Inga alumni ännu.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-gray-600">Startup</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Program</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Projekt</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Möten</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">IRL-snitt</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Avslutad</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {startups.map((s) => {
                const irl = avgIrl(s.irlProfiles[0] as Record<string, unknown> | null)
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.sector}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.program?.name ?? <span className="text-gray-300">–</span>}
                    </td>
                    <td className="px-4 py-3">
                      {s.funderProjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {s.funderProjects.map(({ project }) => (
                            <span key={project.name}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {project.funderName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300">–</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {s._count.sessions}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {irl ? (
                        <span className="text-sm font-medium text-[#1D9E75]">{irl}</span>
                      ) : (
                        <span className="text-gray-300">–</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(s.updatedAt).toLocaleDateString("sv-SE")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/coaching/${s.id}`} className="text-xs text-[#1D9E75] hover:underline">
                        Visa →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
