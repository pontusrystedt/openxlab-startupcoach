import { NextRequest, NextResponse } from "next/server"
import { requireCoach } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await requireCoach()

  const collections = await prisma.knowledgeCollection.findMany({
    where: {
      OR: [{ isGlobal: true }, { orgId: session.user.orgId }],
    },
    orderBy: [{ isGlobal: "desc" }, { name: "asc" }],
  })

  // Räkna dokument per samling
  const allItems = await prisma.knowledgeItem.findMany({
    where: { orgId: session.user.orgId },
    select: { collections: true },
  })

  const countMap: Record<string, number> = {}
  for (const item of allItems) {
    for (const col of item.collections) {
      countMap[col] = (countMap[col] ?? 0) + 1
    }
  }

  return NextResponse.json(
    collections.map((c) => ({ ...c, count: countMap[c.slug] ?? 0 }))
  )
}

export async function POST(req: NextRequest) {
  const session = await requireCoach()

  if (!session.user.orgId) {
    return NextResponse.json({ error: "Ingen organisation" }, { status: 403 })
  }

  const { name, description } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: "Namn krävs" }, { status: 400 })
  }

  const slug = name
    .toLowerCase()
    .replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")

  const existing = await prisma.knowledgeCollection.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: "En samling med det namnet finns redan" }, { status: 409 })
  }

  const collection = await prisma.knowledgeCollection.create({
    data: {
      slug,
      name: name.trim(),
      description: description?.trim() || null,
      isGlobal: false,
      orgId: session.user.orgId,
    },
  })

  return NextResponse.json({ ...collection, count: 0 })
}
