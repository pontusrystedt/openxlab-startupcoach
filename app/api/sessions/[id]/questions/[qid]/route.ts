import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  await requireCoach()
  const { qid } = await params
  const { isChecked } = await req.json()

  const question = await prisma.meetingQuestion.update({
    where: { id: qid },
    data: { isChecked: Boolean(isChecked) },
  })

  return NextResponse.json(question)
}
