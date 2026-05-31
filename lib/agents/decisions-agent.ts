import { Mistral } from "@mistralai/mistralai"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import { buildAgentContext } from "./context"

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! })
const AGENT_NAME = "decisions_agent"
const AGENT_VERSION = "v1"

const SYSTEM_PROMPT = `Du är en AI-assistent som stödjer en startupcoach vid Ideon Science Park.
Din uppgift är att analysera transkriptionen från ett coachmöte och identifiera beslut, uppföljningspunkter och åtgärder.

Regler:
- Max 10 beslut/åtgärder
- Varje beslut är konkret och handlingsbart
- Matcha varje beslut mot en relevant startup om det är tydligt från kontexten
- Prioritera 1–3 (1 = lägst, 3 = högst)

Svara ALLTID som giltig JSON i detta format, inget annat:
{
  "decisions": [
    {
      "text": "string",
      "comment": "string eller null",
      "priority": 1,
      "startupName": "string eller null"
    }
  ]
}

Nuvarande datum: ${new Date().toISOString().split("T")[0]}`

export async function runDecisionsAgent(meetingId: string): Promise<void> {
  const meeting = await prisma.coachMeeting.findUnique({
    where: { id: meetingId },
    include: {
      org: {
        include: {
          startups: {
            where: { status: "COACHING" },
            select: { id: true, name: true },
          },
        },
      },
    },
  })

  if (!meeting) {
    throw new Error(`CoachMeeting ${meetingId} hittades inte`)
  }

  if (!meeting.encryptedTranscript || !meeting.transcriptIv || !meeting.transcriptAuthTag) {
    throw new Error(`Inget transkript för möte ${meetingId}`)
  }

  const transcriptText = decrypt(
    meeting.encryptedTranscript,
    meeting.transcriptIv,
    meeting.transcriptAuthTag
  )

  // Hämta knowledgeText från orgId
  const { knowledgeText } = meeting.org
    ? await buildAgentContext(meeting.orgId, "", ["general"])
    : { knowledgeText: "" }

  // Bygg startup-lista för matchning
  const startups = meeting.org?.startups ?? []
  const startupList =
    startups.length > 0
      ? `Aktiva startups i coaching:\n${startups.map((s) => `- ${s.name}`).join("\n")}`
      : ""

  const userMessage = `Möte: ${meeting.title}
Datum: ${new Date(meeting.meetingDate).toLocaleDateString("sv-SE")}
${startupList ? `\n${startupList}\n` : ""}${knowledgeText ? `\n--- Relevant kunskap ---\n${knowledgeText}\n` : ""}
--- Transkription ---
${transcriptText}`

  const response = await client.chat.complete({
    model: "mistral-large-latest",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    responseFormat: { type: "json_object" },
  })

  const rawOutput =
    typeof response.choices?.[0]?.message?.content === "string"
      ? response.choices[0].message.content
      : ""

  let parsed: {
    decisions: Array<{
      text: string
      comment: string | null
      priority: number
      startupName: string | null
    }>
  }

  try {
    parsed = JSON.parse(rawOutput)
  } catch {
    throw new Error(`Mistral returnerade ogiltig JSON: ${rawOutput}`)
  }

  // Matcha startupName case-insensitivt mot org:s COACHING startups
  const decisionsData = parsed.decisions.slice(0, 10).map((d) => {
    let startupId: string | null = null
    if (d.startupName) {
      const match = startups.find(
        (s) => s.name.toLowerCase() === d.startupName!.toLowerCase()
      )
      startupId = match?.id ?? null
    }
    return {
      text: d.text,
      comment: d.comment ?? null,
      priority: d.priority ?? 1,
      startupId,
      meetingId,
      orgId: meeting.orgId,
      agentSource: `${AGENT_NAME}_${AGENT_VERSION}`,
    }
  })

  await prisma.$transaction([
    prisma.decision.createMany({ data: decisionsData }),
    prisma.coachMeeting.update({
      where: { id: meetingId },
      data: { agentRan: true },
    }),
  ])
}
