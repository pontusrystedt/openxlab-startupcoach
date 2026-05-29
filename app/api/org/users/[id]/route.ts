import { NextRequest, NextResponse } from "next/server"
import { requireClientAdmin } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireClientAdmin()
  const { id } = await params
  const body = await req.json()

  // Verifiera att användaren tillhör samma org
  const user = await prisma.user.findFirst({
    where: { id, orgId: session.user.orgId! },
  })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Tillåtna fält att uppdatera
  const { isActive, name, email, role, startupId } = body

  // Får inte inaktivera sig själv
  if (id === session.user.id && isActive === false) {
    return NextResponse.json({ error: "Kan inte inaktivera ditt eget konto" }, { status: 400 })
  }

  // Validera roll om den skickas
  if (role && !["COACH", "CLIENT_ADMIN", "ENTREPRENEUR"].includes(role)) {
    return NextResponse.json({ error: "Ogiltig roll" }, { status: 400 })
  }

  // Om roll byts till ENTREPRENEUR måste startupId finnas
  const targetRole = role ?? user.role
  if (targetRole === "ENTREPRENEUR" && startupId === null) {
    return NextResponse.json({ error: "Grundare måste kopplas till ett bolag" }, { status: 400 })
  }

  // Verifiera att e-post inte redan används av annan
  if (email && email !== user.email) {
    const conflict = await prisma.user.findUnique({ where: { email } })
    if (conflict) return NextResponse.json({ error: "E-postadressen används redan" }, { status: 409 })
  }

  // Verifiera att startupId tillhör samma org
  if (startupId) {
    const startup = await prisma.startup.findFirst({
      where: { id: startupId, orgId: session.user.orgId! },
    })
    if (!startup) return NextResponse.json({ error: "Bolaget hittades inte" }, { status: 404 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(isActive !== undefined ? { isActive } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(startupId !== undefined ? { startupId: startupId || null } : {}),
    },
    select: {
      id: true, email: true, name: true, role: true,
      isActive: true, emailVerified: true,
      startupId: true, startup: { select: { name: true } },
      createdAt: true,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireClientAdmin()
  const { id } = await params

  const user = await prisma.user.findFirst({
    where: { id, orgId: session.user.orgId! },
  })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (id === session.user.id) {
    return NextResponse.json({ error: "Kan inte radera ditt eget konto" }, { status: 400 })
  }

  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
