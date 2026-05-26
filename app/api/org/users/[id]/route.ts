import { NextRequest, NextResponse } from "next/server"
import { requireClientAdmin } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireClientAdmin()
  const { id } = await params
  const { isActive } = await req.json()

  // Verifiera att användaren tillhör samma org
  const user = await prisma.user.findFirst({
    where: { id, orgId: session.user.orgId! },
  })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Får inte inaktivera sig själv
  if (id === session.user.id) {
    return NextResponse.json({ error: "Kan inte inaktivera ditt eget konto" }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive },
    select: { id: true, email: true, role: true, isActive: true },
  })

  return NextResponse.json(updated)
}
