import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import MeetingSupportClient from "./MeetingSupportClient"

export default async function MeetingSupportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireCoach()
  const { id } = await params

  const startup = await prisma.startup.findUnique({
    where: { id },
    include: {
      program: {
        include: {
          questionDoc: true,
        },
      },
    },
  })

  if (!startup) notFound()

  const questionText = startup.program?.questionDoc?.extractedText ?? null

  // Parsa frågor: rader som matchar /^\d+[.)]/
  let questions: string[] = []
  if (questionText) {
    questions = questionText
      .split("\n")
      .filter((line) => /^\d+[.)]/.test(line.trim()))
      .map((line) => line.trim())
  }

  if (questions.length === 0) {
    questions = [
      "1. Beskriv er affärsidé och vilka problem ni löser.",
      "2. Vem är er målkund och vad är marknadsstorleken?",
      "3. Vad är er tekniska lösning och mognadsgrad (TRL)?",
      "4. Berätta om teamet – kompetens och roller.",
      "5. Vad är er affärsmodell och intäktsstrategi?",
      "6. Vad är de största riskerna ni ser?",
      "7. Hur ser er finansiella situation ut?",
    ]
  }

  return (
    <MeetingSupportClient
      startupName={startup.name}
      questions={questions}
    />
  )
}
