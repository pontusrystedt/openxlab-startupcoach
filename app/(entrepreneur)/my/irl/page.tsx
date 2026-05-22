import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/access"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { IrlRadar } from "@/components/IrlRadar"

export default async function EntrepreneurIrlPage() {
  await requireAuth()
  const session = await auth()
  if (!session?.user.startupId) redirect("/login")

  const profiles = await prisma.irlProfile.findMany({
    where: { startupId: session.user.startupId },
    orderBy: { createdAt: "desc" },
  })

  const [current, previous] = profiles
  const DIMS = ["crl", "trl", "brl", "iprl", "frl", "orl"] as const

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Min IRL-profil</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {current ? (
          <>
            <IrlRadar current={current} previous={previous} />
            <div className="grid grid-cols-3 gap-4 mt-4">
              {DIMS.map((d) => (
                <div key={d} className="text-center">
                  <p className="text-xs text-gray-500 uppercase">{d}</p>
                  <p className="text-2xl font-semibold text-[#1D9E75]">
                    {current[d]}
                    <span className="text-sm text-gray-400">/9</span>
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-gray-400 py-12">Ingen IRL-profil ännu</p>
        )}
      </div>

      {profiles.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <h2 className="px-4 py-3 font-medium text-gray-900 border-b border-gray-100">
            Historik
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Datum</th>
                {DIMS.map((d) => (
                  <th key={d} className="px-4 py-2 text-left font-medium text-gray-600">
                    {d.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(p.createdAt).toLocaleDateString("sv-SE")}
                  </td>
                  {DIMS.map((d) => (
                    <td key={d} className="px-4 py-3 font-medium">
                      {p[d]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
