"use client"

import { useState } from "react"
import Link from "next/link"

interface IrlProfile {
  crl: number
  trl: number
  brl: number
  iprl: number
  frl: number
  orl: number
}

interface FundingRound {
  roundType: string | null
  quarter: string
  status: string
  amountSek: number | null
}

interface Program {
  name: string
}

interface FunderProject {
  project: { name: string; funderName: string }
}

interface Session {
  scheduledAt: string
}

interface Startup {
  id: string
  name: string
  sector: string
  status: string
  contactEmail: string | null
  contactPhone: string | null
  orgNumber: string | null
  registeredAt: string | null
  businessIdea: string | null
  founderOwnershipPct: number | null
  activeOwnerPct: number | null
  aiStatus: string
  createdAt: string
  program: Program | null
  funderProjects: FunderProject[]
  fundingRound: FundingRound | null
  irlProfiles: IrlProfile[]
  sessions: Session[]
  _count: { sessions: number }
}

const FUNDING_LABEL: Record<string, string> = {
  PLANNED: "Planerad",
  ACTIVE: "Aktiv",
  CLOSED: "Stängd",
  NOT_DEFINED: "–",
}

const STATUS_LABEL: Record<string, string> = {
  SCREENING: "Screening",
  COACHING: "Coaching",
  ALUMNI: "Alumni",
  ARCHIVED: "Arkiverad",
}

const STATUS_COLOR: Record<string, string> = {
  SCREENING: "bg-yellow-50 text-yellow-700",
  COACHING: "bg-green-50 text-green-700",
  ALUMNI: "bg-blue-50 text-blue-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
}

const AI_COLOR: Record<string, string> = {
  ON_TRACK: "text-green-600",
  AT_RISK: "text-yellow-600",
  OFF_TRACK: "text-red-500",
}

const IRL_DIMS = ["crl", "trl", "brl", "iprl", "frl", "orl"] as const

function avgIrl(profile: IrlProfile | undefined) {
  if (!profile) return null
  const sum = IRL_DIMS.reduce((a, d) => a + (profile[d] ?? 0), 0)
  return (sum / IRL_DIMS.length).toFixed(1)
}

export function DashboardTable({ startups }: { startups: Startup[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Startup</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Sektor</th>
            <th className="px-4 py-3 text-center font-medium text-gray-600">Möten</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Senaste möte</th>
            <th className="px-4 py-3 text-center font-medium text-gray-600">IRL</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Program</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
            <th className="px-4 py-3 w-6"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {startups.map((startup) => {
            const isExpanded = expandedId === startup.id
            const irl = avgIrl(startup.irlProfiles[0])
            return (
              <>
                <tr
                  key={startup.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : startup.id)}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/coaching/${startup.id}`}
                      className="font-medium text-[#1D9E75] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {startup.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{startup.sector}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{startup._count.sessions}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {startup.sessions[0]
                      ? new Date(startup.sessions[0].scheduledAt).toLocaleDateString("sv-SE")
                      : "–"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {irl ? (
                      <span className="font-medium text-[#1D9E75]">{irl}</span>
                    ) : (
                      <span className="text-gray-300">–</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {startup.program?.name ?? <span className="text-gray-300">–</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLOR[startup.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABEL[startup.status] ?? startup.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{isExpanded ? "▲" : "▼"}</td>
                </tr>

                {isExpanded && (
                  <tr key={`${startup.id}-expanded`} className="bg-gray-50 border-b border-gray-100">
                    <td colSpan={8} className="px-6 py-4">
                      <div className="grid grid-cols-4 gap-4 text-sm">

                        {/* Kontakt */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kontakt</p>
                          {startup.contactEmail ? (
                            <p><a href={`mailto:${startup.contactEmail}`} className="text-[#1D9E75] hover:underline">{startup.contactEmail}</a></p>
                          ) : <p className="text-gray-300">–</p>}
                          {startup.contactPhone && <p className="text-gray-600">{startup.contactPhone}</p>}
                        </div>

                        {/* Bolagsdata */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bolag</p>
                          {startup.orgNumber && (
                            <p className="text-gray-600">Org.nr: {startup.orgNumber}</p>
                          )}
                          {startup.registeredAt && (
                            <p className="text-gray-600">Reg: {new Date(startup.registeredAt).toLocaleDateString("sv-SE")}</p>
                          )}
                          {startup.founderOwnershipPct != null && (
                            <p className="text-gray-600">Grundare: {startup.founderOwnershipPct}%</p>
                          )}
                          {startup.activeOwnerPct != null && (
                            <p className="text-gray-600">Aktiva ägare: {startup.activeOwnerPct}%</p>
                          )}
                          {!startup.orgNumber && !startup.registeredAt && <p className="text-gray-300">–</p>}
                        </div>

                        {/* Projekt & AI */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Projekt & AI</p>
                          {startup.funderProjects.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {startup.funderProjects.map(({ project }) => (
                                <span key={project.name} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                  {project.funderName}
                                </span>
                              ))}
                            </div>
                          ) : <p className="text-gray-300">Inga projekt</p>}
                          <p className={`text-xs ${AI_COLOR[startup.aiStatus] ?? "text-gray-400"}`}>
                            AI: {startup.aiStatus.replace("_", " ")}
                          </p>
                        </div>

                        {/* Affärsidé */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Affärsidé</p>
                          {startup.businessIdea ? (
                            <p className="text-gray-600 text-xs leading-relaxed line-clamp-4">{startup.businessIdea}</p>
                          ) : <p className="text-gray-300">–</p>}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
      {startups.length === 0 && (
        <p className="text-center py-12 text-gray-400">Inga startups ännu</p>
      )}
    </div>
  )
}
