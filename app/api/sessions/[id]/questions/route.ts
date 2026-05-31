import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireCoach()
  const { id } = await params

  const questions = await prisma.meetingQuestion.findMany({
    where: { sessionId: id },
    orderBy: { priority: "asc" },
  })

  return NextResponse.json(questions)
}
