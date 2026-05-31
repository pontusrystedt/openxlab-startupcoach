import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import { notFound } from "next/navigation"
import Link from "next/link"
import { GenerateBriefButton } from "./GenerateBriefButton"

export const dynamic = "force-dynamic"

const CATEGORY_CONFIG = {
  followup: { icon: "↩", label: "Uppföljning", color: "text-blue-600", bg: "bg-blue-50" },
  irl_gap: { icon: "⬡", label: "IRL-gap", color: "text-amber-600", bg: "bg-amber-50" },
  explore: { icon: "◈", label: "Utforska", color: "text-green-600", bg: "bg-green-50" },
  specialist: { icon: "★", label: "Specialist", color: "text-purple-600", bg: "bg-purple-50" },
} as const

interface Brief {
  statusSummary: string
  focusAreas: Array<{ title: string; reason: string }>
  confirmItems: string[]
  generatedAt: string
}

export default async function BriefPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>
}) {
  await requireCoach()
  const { id: startupId, sessionId } = await params

  const [session, questions] = await Promise.all([
    prisma.session.findUnique({
      where: { id: sessionId },
      include: { startup: true },
    }),
    prisma.meetingQuestion.findMany({
      where: { sessionId },
      orderBy: { priority: "asc" },
    }),
  ])

  if (!session || session.startupId !== startupId) notFound()

  let brief: Brief | null = null
  if (session.encryptedBrief && session.briefIv && session.briefAuthTag) {
    try {
      brief = JSON.parse(
        decrypt(session.encryptedBrief, session.briefIv, session.briefAuthTag)
      )
    } catch {
      /* vis fallback */
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/coaching/${startupId}/sessions/${sessionId}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← {session.startup.name} / Session #{session.sessionNumber}
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">Mötesbrief</h1>
          <p className="text-sm text-gray-500">
            {new Date(session.scheduledAt).toLocaleDateString("sv-SE", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Link
          href={`/coaching/${startupId}/sessions/${sessionId}/live`}
          className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 flex-shrink-0"
        >
          ▶ Starta live-stöd
        </Link>
      </div>

      {!brief ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-sm mb-6">
            Ingen mötesbrief genererad ännu. AI-agenten analyserar all information
            om startupen och förbereder situationsanpassade frågor (~30 sek).
          </p>
          <GenerateBriefButton sessionId={sessionId} />
        </div>
      ) : (
        <>
          {/* Statusbild */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Statusbild
            </h2>
            <p className="text-sm text-gray-800 leading-relaxed">{brief.statusSummary}</p>
            <p className="text-xs text-gray-400 mt-3">
              Genererad {new Date(brief.generatedAt).toLocaleDateString("sv-SE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Fokusområden */}
          {brief.focusAreas.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Fokusområden
              </h2>
              <div className="space-y-3">
                {brief.focusAreas.map((area, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center font-medium">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{area.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{area.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Frågor */}
          {questions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Frågor att ställa
              </h2>
              <div className="space-y-2">
                {questions.map((q) => {
                  const config =
                    CATEGORY_CONFIG[q.category as keyof typeof CATEGORY_CONFIG] ??
                    CATEGORY_CONFIG.explore
                  return (
                    <div
                      key={q.id}
                      className={`flex items-start gap-3 p-3 rounded-lg ${config.bg}`}
                    >
                      <span className={`text-base flex-shrink-0 ${config.color}`}>
                        {config.icon}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{q.text}</p>
                        <p className={`text-xs mt-0.5 ${config.color}`}>
                          {config.label}
                          {q.agentSlug &&
                            ` · ${q.agentSlug.replace(/_/g, " ")}`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Bekräfta / följ upp */}
          {brief.confirmItems.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Bekräfta / följ upp
              </h2>
              <ul className="space-y-2">
                {brief.confirmItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-400 flex-shrink-0">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Regenerera */}
          <div className="text-center">
            <GenerateBriefButton sessionId={sessionId} />
          </div>
        </>
      )}
    </div>
  )
}
