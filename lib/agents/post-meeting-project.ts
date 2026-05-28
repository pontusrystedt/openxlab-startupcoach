import { Mistral } from "@mistralai/mistralai"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! })

const SYSTEM_PROMPT = `Du är en AI-assistent som stödjer ett innovationsprogram vid Ideon Science Park.
Din uppgift är att analysera transkriptionen från ett projektmöte och producera:
1. En kort sammanfattning av vad som kom fram (max 3 meningar, skriv "vi" som om du satt med i mötet)
2. En intern notering till projektledaren (max 2 meningar)
3. En prioriterad todo-lista med MAX 5 punkter för projektteamet

Regler för todo-listan:
- Max 5 punkter, sorterade efter impact (viktigast först)
- Varje punkt är konkret och handlingsbar, börjar med ett verb
- Fokus på projektleveranser, rapportering och finansiärskrav

Svara ALLTID som giltig JSON i detta format, inget annat:
{
  "insight": "string",
  "coachNote": "string",
  "todos": [
    { "text": "string", "priority": 1, "dueDate": "YYYY-MM-DD eller null" }
  ]
}

Nuvarande datum: ${new Date().toISOString().split("T")[0]}`

export async function runPostMeetingProjectAgent(meetingId: string): Promise<void> {
  const meeting = await prisma.projectMeeting.findUnique({
    where: { id: meetingId },
    include: {
      project: {
        include: {
          files: { select: { extractedText: true } },
          startups: { include: { startup: { select: { name: true, sector: true, businessIdea: true } } } },
        },
      },
    },
  })

  if (!meeting?.transcriptEncrypted || !meeting.transcriptIv || !meeting.transcriptAuthTag) {
    throw new Error(`Inget transkript för projektmöte ${meetingId}`)
  }

  const transcriptText = decrypt(
    meeting.transcriptEncrypted,
    meeting.transcriptIv,
    meeting.transcriptAuthTag
  )

  // Bygg kontext från projektfiler
  const projectFilesText = meeting.project.files
    .map((f) => f.extractedText)
    .filter(Boolean)
    .join("\n\n")

  // Lista kopplade startups
  const startupList = meeting.project.startups
    .map((s) => `- ${s.startup.name}${s.startup.sector ? ` (${s.startup.sector})` : ""}`)
    .join("\n")

  const userMessage = `Projekt: ${meeting.project.name}
Finansiär: ${meeting.project.funderName}
Projektperiod: ${new Date(meeting.project.periodStart).toLocaleDateString("sv-SE")} – ${new Date(meeting.project.periodEnd).toLocaleDateString("sv-SE")}
Möte #${meeting.meetingNumber} — datum: ${meeting.scheduledAt.toISOString().split("T")[0]}

${startupList ? `Kopplade startups:\n${startupList}\n` : ""}${meeting.project.requirementText ? `\nProjektkrav / rapporteringskrav:\n${meeting.project.requirementText}\n` : ""}${projectFilesText ? `\n--- Projektdokument / ansökan ---\n${projectFilesText.slice(0, 8000)}\n` : ""}
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
    insight: string
    coachNote: string
    todos: Array<{ text: string; priority: number; dueDate: string | null }>
  }

  try {
    parsed = JSON.parse(rawOutput)
  } catch {
    throw new Error(`Mistral returnerade ogiltig JSON: ${rawOutput}`)
  }

  await prisma.$transaction([
    // Spara summary på mötet (plain text — AI-genererat, ej känslig persondata)
    prisma.projectMeeting.update({
      where: { id: meetingId },
      data: {
        summaryInsight: parsed.insight,
        summaryCoachNote: parsed.coachNote,
      },
    }),
    // Radera gamla AI-genererade todos för detta möte
    prisma.projectTodo.deleteMany({ where: { meetingId } }),
    // Skapa nya todos
    prisma.projectTodo.createMany({
      data: parsed.todos.slice(0, 5).map((t) => ({
        projectId: meeting.projectId,
        meetingId,
        text: t.text,
        priority: t.priority,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
      })),
    }),
  ])
}
