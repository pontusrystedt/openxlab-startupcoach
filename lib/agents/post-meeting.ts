import { Mistral } from "@mistralai/mistralai"
import { prisma } from "@/lib/prisma"
import { decrypt, encrypt } from "@/lib/crypto"
import { buildAgentContext } from "./context"
import crypto from "crypto"

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! })
const AGENT_NAME = "post_meeting_agent"
const AGENT_VERSION = "v1"

const SYSTEM_PROMPT = `Du är en AI-assistent som stödjer en startupcoach vid Ideon Science Park.
Din uppgift är att analysera transkriptionen från ett coachningsmöte och producera:
1. En kort sammanfattning av vad som kom fram (max 3 meningar, skriv "vi" som om du satt med i mötet)
2. En prioriterad todo-lista med MAX 5 punkter för entreprenören

Regler för todo-listan:
- Max 5 punkter, sorterade efter impact (viktigast först)
- Varje punkt är konkret och handlingsbar, börjar med ett verb
- Inga abstrakta råd — bara saker entreprenören faktiskt kan göra

Svara ALLTID som giltig JSON i detta format, inget annat:
{
  "insight": "string",
  "coachNote": "string (intern notering för coach, max 2 meningar)",
  "todos": [
    { "text": "string", "priority": 1, "dueDate": "YYYY-MM-DD eller null" }
  ]
}

Nuvarande datum: ${new Date().toISOString().split("T")[0]}`

export async function runPostMeetingAgent(sessionId: string): Promise<void> {
  const startTime = Date.now()

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      transcript: true,
      startup: {
        include: {
          irlProfiles: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  })

  if (!session?.transcript?.encryptedText) {
    throw new Error(`Ingen transkription för session ${sessionId}`)
  }

  const transcriptText = decrypt(
    session.transcript.encryptedText,
    session.transcript.iv,
    session.transcript.authTag
  )

  const latestIrl = session.startup.irlProfiles[0]
  const irlContext = latestIrl
    ? `Startupens nuvarande IRL-profil: CRL=${latestIrl.crl}, TRL=${latestIrl.trl}, BRL=${latestIrl.brl}, IPRL=${latestIrl.iprl}, FRL=${latestIrl.frl}, ORL=${latestIrl.orl}`
    : "Ingen IRL-profil registrerad än."

  const mötesdatum = session.scheduledAt.toISOString().split("T")[0]

  // Hämta agentkontext om org finns
  const { knowledgeText, startupFileText, projectFileText } = session.startup.orgId
    ? await buildAgentContext(session.startup.orgId, session.startupId)
    : { knowledgeText: "", startupFileText: "", projectFileText: "" }

  const userMessage = `Startup: ${session.startup.name} (${session.startup.sector})
Session #${session.sessionNumber} — datum: ${mötesdatum}
${irlContext}
${knowledgeText ? `\n--- Relevant kunskap från knowledge-repo ---\n${knowledgeText}\n` : ""}${startupFileText ? `--- Uppladdade dokument för denna startup ---\n${startupFileText}\n` : ""}${projectFileText ? `--- Finansiärsansökan / projektdokument ---\n${projectFileText}\n` : ""}
--- Transkription ---
${transcriptText}`

  const inputHash = crypto.createHash("sha256").update(userMessage).digest("hex")

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
    insight: string
    coachNote: string
    todos: Array<{ text: string; priority: number; dueDate: string | null }>
  }

  try {
    parsed = JSON.parse(rawOutput)
  } catch {
    throw new Error(`Mistral returnerade ogiltig JSON: ${rawOutput}`)
  }

  const outputHash = crypto.createHash("sha256").update(rawOutput).digest("hex")
  const latencyMs = Date.now() - startTime

  const summaryData = JSON.stringify({
    insight: parsed.insight,
    coachNote: parsed.coachNote,
    agentVersion: AGENT_VERSION,
  })
  const encrypted = encrypt(summaryData)

  await prisma.$transaction([
    prisma.sessionSummary.upsert({
      where: { sessionId },
      create: {
        sessionId,
        encryptedData: encrypted.encryptedText,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      },
      update: {
        encryptedData: encrypted.encryptedText,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      },
    }),
    prisma.todo.deleteMany({ where: { sessionId } }),
    prisma.todo.createMany({
      data: parsed.todos.slice(0, 5).map((t) => ({
        sessionId,
        text: t.text,
        priority: t.priority,
        agentSource: `${AGENT_NAME}_${AGENT_VERSION}`,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
      })),
    }),
    prisma.agentLog.create({
      data: {
        agentName: AGENT_NAME,
        agentVersion: AGENT_VERSION,
        sessionId,
        inputHash,
        outputHash,
        latencyMs,
      },
    }),
  ])
}
