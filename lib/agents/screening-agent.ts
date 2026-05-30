import { Mistral } from "@mistralai/mistralai"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import { buildAgentContext } from "./context"

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! })
const AGENT_VERSION = "v1"

const SYSTEM_PROMPT = `Du är en AI-assistent som stödjer en startupcoach vid Ideon Science Park.
Din uppgift är att analysera transkriptionen från ett screeningmöte och besvara programmets screeningfrågor.

Regler:
- Svara på varje fråga baserat på vad som framkommer i transkriptionen
- Om en fråga inte besvaras i transkriptionen, ange "Framgick ej i mötet"
- Var objektiv och kortfattad (1–3 meningar per svar)
- Identifiera styrkor och risker
- Ge en rekommendation: APPROVE, REJECT eller UNCERTAIN

Svara ALLTID som giltig JSON i detta format, inget annat:
{
  "answers": [
    { "order": 1, "question": "string", "answer": "string" }
  ],
  "strengths": ["string"],
  "risks": ["string"],
  "recommendation": "APPROVE" | "REJECT" | "UNCERTAIN",
  "reasoning": "string"
}

Nuvarande datum: ${new Date().toISOString().split("T")[0]}`

export async function runScreeningAgent(
  startupId: string,
  programId?: string
): Promise<void> {
  const startup = await prisma.startup.findUnique({
    where: { id: startupId },
    include: {
      program: {
        include: {
          questionDoc: true,
        },
      },
    },
  })

  if (!startup) {
    throw new Error(`Startup ${startupId} hittades inte`)
  }

  if (
    !startup.screeningTranscriptEncrypted ||
    !startup.screeningTranscriptIv ||
    !startup.screeningTranscriptAuthTag
  ) {
    throw new Error(`Inget screenigtranskript för startup ${startupId}`)
  }

  const transcriptText = decrypt(
    startup.screeningTranscriptEncrypted,
    startup.screeningTranscriptIv,
    startup.screeningTranscriptAuthTag
  )

  // Använd angivet programId eller startup.programId
  const resolvedProgramId = programId ?? startup.programId

  let questions: string[] = []
  let questionDoc: { extractedText: string } | null = null

  if (resolvedProgramId) {
    const program = await prisma.program.findUnique({
      where: { id: resolvedProgramId },
      include: { questionDoc: true },
    })
    questionDoc = program?.questionDoc ?? null
  } else if (startup.program?.questionDoc) {
    questionDoc = startup.program.questionDoc
  }

  if (questionDoc?.extractedText) {
    // Parsa frågor: rader som matchar /^\d+[.)]/
    questions = questionDoc.extractedText
      .split("\n")
      .filter((line) => /^\d+[.)]/.test(line.trim()))
      .map((line) => line.trim())
  }

  if (questions.length === 0) {
    // Fallback: generiska frågor
    questions = [
      "1. Beskriv startupens affärsidé och marknad.",
      "2. Vad är teamets erfarenhet och kompetens?",
      "3. Vad är den tekniska mognaden (TRL)?",
      "4. Vilka är de största riskerna?",
      "5. Vad är startupens finansiella situation?",
    ]
  }

  // Hämta knowledge-kontext
  const { knowledgeText } = startup.orgId
    ? await buildAgentContext(startup.orgId, startupId)
    : { knowledgeText: "" }

  const questionsText = questions
    .map((q, i) => `${i + 1}. ${q.replace(/^\d+[.)]\s*/, "")}`)
    .join("\n")

  const userMessage = `Startup: ${startup.name} (${startup.sector})
${startup.businessIdea ? `Affärsidé: ${startup.businessIdea}\n` : ""}${knowledgeText ? `\n--- Relevant kunskap ---\n${knowledgeText}\n` : ""}
--- Screeningfrågor ---
${questionsText}

--- Screeningtranskription ---
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
    answers: Array<{ order: number; question: string; answer: string }>
    strengths: string[]
    risks: string[]
    recommendation: string
    reasoning: string
  }

  try {
    parsed = JSON.parse(rawOutput)
  } catch {
    throw new Error(`Mistral returnerade ogiltig JSON: ${rawOutput}`)
  }

  const finalProgramId = resolvedProgramId ?? startup.programId ?? "unknown"

  await prisma.$transaction([
    // Ta bort gamla svar för denna startup
    prisma.screeningResponse.deleteMany({ where: { startupId } }),
    // Skapa nya svar
    prisma.screeningResponse.createMany({
      data: parsed.answers.map((a, i) => ({
        startupId,
        programId: finalProgramId,
        question: questions[i] ?? a.question,
        aiAnswer: a.answer,
        order: i + 1,
      })),
    }),
    // Upsert analysis
    prisma.screeningAnalysis.upsert({
      where: { startupId },
      create: {
        startupId,
        strengths: JSON.stringify(parsed.strengths),
        risks: JSON.stringify(parsed.risks),
        recommendation: parsed.recommendation,
        reasoning: parsed.reasoning,
        agentVersion: AGENT_VERSION,
      },
      update: {
        strengths: JSON.stringify(parsed.strengths),
        risks: JSON.stringify(parsed.risks),
        recommendation: parsed.recommendation,
        reasoning: parsed.reasoning,
        agentVersion: AGENT_VERSION,
      },
    }),
  ])
}
