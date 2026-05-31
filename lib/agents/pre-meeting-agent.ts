import { Mistral } from "@mistralai/mistralai"
import { prisma } from "@/lib/prisma"
import { decrypt, encrypt } from "@/lib/crypto"
import { runAgent } from "./agent-runner"
import crypto from "crypto"

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! })
const AGENT_VERSION = "v1"

// ── Steg 1: Bygg kontextbild av startupen ─────────────────────────────────

async function buildStartupContext(
  startupId: string,
  sessionId: string
): Promise<string> {
  const startup = await prisma.startup.findUnique({
    where: { id: startupId },
    include: {
      irlProfiles: { orderBy: { createdAt: "desc" }, take: 3 },
      sessions: {
        where: { id: { not: sessionId } },
        orderBy: { scheduledAt: "desc" },
        take: 3,
        include: {
          todos: {
            where: { status: { not: "DELETED" } },
            orderBy: { priority: "asc" },
          },
          summary: true,
        },
      },
      files: {
        orderBy: { uploadedAt: "desc" },
        take: 5,
        select: { fileName: true, extractedText: true, uploadedAt: true },
      },
    },
  })

  if (!startup) throw new Error(`Startup ${startupId} finns inte`)

  const currentSession = await prisma.session.findUnique({
    where: { id: sessionId },
  })

  const irlHistory = startup.irlProfiles
  const latestIrl = irlHistory[0]
  const previousIrl = irlHistory[1]

  const irlTrend =
    latestIrl && previousIrl
      ? Object.entries({
          crl: "Kund",
          trl: "Teknik",
          brl: "Affär",
          iprl: "IP",
          frl: "Funding",
          orl: "Org",
        })
          .filter(([key]) => {
            const curr = latestIrl[key as keyof typeof latestIrl] as number
            const prev = previousIrl[key as keyof typeof previousIrl] as number
            return curr !== prev
          })
          .map(([key, label]) => {
            const curr = latestIrl[key as keyof typeof latestIrl] as number
            const prev = previousIrl[key as keyof typeof previousIrl] as number
            return `${label}: ${prev} → ${curr} (${curr > prev ? "↑" : "↓"})`
          })
          .join(", ") || "Ingen förändring sedan förra mätning"
      : "Ingen tidigare mätning"

  const lastSession = startup.sessions[0]
  const openTodos =
    lastSession?.todos
      .filter(
        (t) => t.status === "NOT_STARTED" || t.status === "IN_PROGRESS"
      )
      .map(
        (t) =>
          `- [${t.status === "IN_PROGRESS" ? "Pågående" : "Ej påbörjad"}] ${t.text}`
      )
      .join("\n") ?? "Inga öppna todos"

  let lastSummary = "Ingen tidigare session"
  if (lastSession?.summary) {
    try {
      const raw = decrypt(
        lastSession.summary.encryptedData,
        lastSession.summary.iv,
        lastSession.summary.authTag
      )
      const parsed = JSON.parse(raw)
      lastSummary = parsed.insight ?? "Ingen summering"
    } catch {
      /* ignorera dekrypteringsfel */
    }
  }

  const recentFiles =
    startup.files
      .filter((f) => f.extractedText)
      .map(
        (f) =>
          `- ${f.fileName} (${new Date(f.uploadedAt).toLocaleDateString("sv-SE")})`
      )
      .join("\n") || "Inga filer uppladdade"

  return `STARTUP: ${startup.name}
SEKTOR: ${startup.sector ?? "ej angivet"}
AFFÄRSIDÉ: ${startup.businessIdea ?? "ej angivet"}
SESSION: #${currentSession?.sessionNumber ?? "?"}
DATUM: ${
    currentSession?.scheduledAt
      ? new Date(currentSession.scheduledAt).toLocaleDateString("sv-SE")
      : "okänt"
  }

IRL-PROFIL (senaste):
CRL=${latestIrl?.crl ?? "?"}/9  TRL=${latestIrl?.trl ?? "?"}/9  BRL=${latestIrl?.brl ?? "?"}/9
IPRL=${latestIrl?.iprl ?? "?"}/9  FRL=${latestIrl?.frl ?? "?"}/9  ORL=${latestIrl?.orl ?? "?"}/9
Trend sedan förra mätning: ${irlTrend}

SEDAN SIST:
${lastSummary}

ÖPPNA TODOS:
${openTodos}

NYLIGEN UPPLADDADE FILER:
${recentFiles}`
}

// ── Steg 2: Samråd med specialistagenter ──────────────────────────────────

async function consultSpecialists(
  startupContext: string,
  startupId: string,
  orgId: string,
  irlProfile: { brl: number; crl: number; frl: number } | null
): Promise<Array<{ agentSlug: string; agentName: string; question: string }>> {
  const agentsToConsult: string[] = []

  if (irlProfile) {
    if (irlProfile.brl <= 3) agentsToConsult.push("pricing_coach", "sales_coach")
    if (irlProfile.crl <= 3) agentsToConsult.push("sales_coach")
    if (irlProfile.frl <= 3) agentsToConsult.push("cfo_agent")
  }

  const uniqueAgents = [...new Set(agentsToConsult)].slice(0, 3)
  const results: Array<{ agentSlug: string; agentName: string; question: string }> = []

  for (const slug of uniqueAgents) {
    try {
      const result = await runAgent({
        agentSlug: slug,
        startupId,
        orgId,
        userMessage: `${startupContext}

Din uppgift: Föreslå EN enda, konkret fråga som coachen bör ställa i nästa coachningsmöte baserat på din expertis och startupens situation.

Frågan ska:
- Vara specifik för denna startup (inte generisk)
- Hjälpa coachen förstå något viktigt inom ditt expertområde
- Vara öppen (inte ja/nej-fråga)
- Ta max 30 sekunder att ställa

Svara ENBART med själva frågan — ingen förklaring, ingen rubrik.`,
        trigger: "pre_meeting",
        encryptOutput: false,
      })

      if (result.output && result.output.length > 10) {
        results.push({
          agentSlug: slug,
          agentName: result.agentName,
          question: result.output.trim().replace(/^["']|["']$/g, ""),
        })
      }
    } catch (err) {
      console.error(`Specialistkonsultation misslyckades för ${slug}:`, err)
    }
  }

  return results
}

// ── Steg 3: Generera komplett brief ───────────────────────────────────────

const BRIEF_SYSTEM_PROMPT = `Du är en erfaren startupcoach-assistent.
Din uppgift är att förbereda en strukturerad mötesbrief för coachen inför ett 45-minuters coachningsmöte.

Briefen ska hjälpa coachen:
1. Snabbt förstå var startupen är just nu
2. Veta vad som är viktigast att fokusera på
3. Ha konkreta, situationsanpassade frågor redo

Regler:
- Basera dig ENBART på given information — inga antaganden
- Frågor ska vara specifika för denna startup, inte generiska
- Prioritera hårt — hellre 5 träffsäkra frågor än 10 vaga
- Skriv på svenska

Kategorier för frågor:
- followup: uppföljning av tidigare todos eller löften
- irl_gap: adresserar ett svagt IRL-område
- explore: utforskar ett nytt område eller möjlighet
- specialist: föreslagen av en specialistagent

Svara ENBART som giltig JSON utan markdown:
{
  "statusSummary": "string — 2-3 meningar om var startupen är just nu",
  "focusAreas": [
    { "title": "string", "reason": "string" }
  ],
  "questions": [
    {
      "text": "string",
      "category": "followup|irl_gap|explore|specialist",
      "agentSlug": "string eller null",
      "priority": 1
    }
  ],
  "confirmItems": [
    "string — sak att bekräfta eller följa upp"
  ]
}`

export async function runPreMeetingAgent(sessionId: string): Promise<void> {
  const startTime = Date.now()

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      startup: {
        include: { irlProfiles: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  })
  if (!session) throw new Error(`Session ${sessionId} finns inte`)

  const orgId = session.startup.orgId
  if (!orgId) throw new Error("Startup saknar orgId")

  const startupContext = await buildStartupContext(session.startupId, sessionId)
  const latestIrl = session.startup.irlProfiles[0]

  const specialistQuestions = await consultSpecialists(
    startupContext,
    session.startupId,
    orgId,
    latestIrl
      ? { brl: latestIrl.brl, crl: latestIrl.crl, frl: latestIrl.frl }
      : null
  )

  const specialistSection =
    specialistQuestions.length > 0
      ? `\nSPECIALISTFRÅGOR (från ${specialistQuestions.map((s) => s.agentName).join(", ")}):\n` +
        specialistQuestions
          .map((s) => `- ${s.agentName}: "${s.question}" (agentSlug: ${s.agentSlug})`)
          .join("\n")
      : ""

  const userMessage = startupContext + specialistSection
  const inputHash = crypto.createHash("sha256").update(userMessage).digest("hex")

  const response = await client.chat.complete({
    model: "mistral-large-latest",
    messages: [
      { role: "system", content: BRIEF_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.3,
    maxTokens: 2000,
    responseFormat: { type: "json_object" },
  })

  const rawContent = response.choices?.[0]?.message?.content
  const rawOutput =
    typeof rawContent === "string"
      ? rawContent
      : Array.isArray(rawContent)
        ? rawContent.map((c) => (typeof c === "string" ? c : "text" in c ? c.text : "")).join("")
        : ""

  const outputHash = crypto.createHash("sha256").update(rawOutput).digest("hex")
  const latencyMs = Date.now() - startTime

  let parsed: {
    statusSummary: string
    focusAreas: Array<{ title: string; reason: string }>
    questions: Array<{
      text: string
      category: string
      agentSlug: string | null
      priority: number
    }>
    confirmItems: string[]
  }

  try {
    parsed = JSON.parse(rawOutput.replace(/```json\n?|\n?```/g, "").trim())
  } catch {
    throw new Error(`Pre-mötes-agent: ogiltig JSON: ${rawOutput}`)
  }

  const briefData = JSON.stringify({
    statusSummary: parsed.statusSummary,
    focusAreas: parsed.focusAreas,
    confirmItems: parsed.confirmItems,
    generatedAt: new Date().toISOString(),
    agentVersion: AGENT_VERSION,
  })
  const encrypted = encrypt(briefData)

  await prisma.$transaction([
    prisma.session.update({
      where: { id: sessionId },
      data: {
        briefGeneratedAt: new Date(),
        encryptedBrief: encrypted.encryptedText,
        briefIv: encrypted.iv,
        briefAuthTag: encrypted.authTag,
      },
    }),
    prisma.meetingQuestion.deleteMany({ where: { sessionId } }),
    prisma.meetingQuestion.createMany({
      data: [
        ...parsed.questions.slice(0, 6).map((q, i) => ({
          sessionId,
          text: q.text,
          category: q.category,
          agentSlug: q.agentSlug ?? null,
          priority: q.priority ?? i + 1,
        })),
        ...specialistQuestions
          .filter((sq) => !parsed.questions.some((q) => q.agentSlug === sq.agentSlug))
          .map((sq, i) => ({
            sessionId,
            text: sq.question,
            category: "specialist",
            agentSlug: sq.agentSlug,
            priority: 10 + i,
          })),
      ],
    }),
    prisma.agentLog.create({
      data: {
        agentName: "pre_meeting_agent",
        agentVersion: AGENT_VERSION,
        sessionId,
        inputHash,
        outputHash,
        latencyMs,
      },
    }),
  ])
}
