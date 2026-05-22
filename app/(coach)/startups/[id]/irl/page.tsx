import { prisma } from "@/lib/prisma"
import { requireCoach } from "@/lib/access"
import Link from "next/link"
import { notFound } from "next/navigation"
import { IrlRadar } from "@/components/IrlRadar"
import IrlForm from "./IrlForm"

export default async function IrlPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireCoach()
  const { id } = await params

  const startup = await prisma.startup.findUnique({
    where: { id },
    include: {
      irlProfiles: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!startup) notFound()

  const [current, previous] = startup.irlProfiles
  const DIMS = ["crl", "trl", "brl", "iprl", "frl", "orl"] as const
  const DIM_LABELS = {
    crl: "CRL – Customer",
    trl: "TRL – Teknik",
    brl: "BRL – Affär",
    iprl: "IPRL – IP",
    frl: "FRL – Funding",
    orl: "ORL – Org",
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/startups/${id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← {startup.name}
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-1">IRL-historik</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          {current ? (
            <IrlRadar current={current} previous={previous} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">
              Ingen mätning ännu
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-medium text-gray-900 mb-4">Ny mätning</h2>
          <IrlForm startupId={id} />
        </div>
      </div>

      {startup.irlProfiles.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Datum</th>
                {DIMS.map((d) => (
                  <th key={d} className="px-4 py-3 text-left font-medium text-gray-600">
                    {d.toUpperCase()}
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-medium text-gray-600">Notering</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {startup.irlProfiles.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(p.createdAt).toLocaleDateString("sv-SE")}
                  </td>
                  {DIMS.map((d) => (
                    <td key={d} className="px-4 py-3 font-medium">
                      {p[d]}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.notes ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
