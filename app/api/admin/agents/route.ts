import { NextResponse } from "next/server"
import { requireClientAdmin } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await requireClientAdmin()

  const agents = await prisma.agentRegistry.findMany({
    orderBy: { sortOrder: "asc" },
  })

  return NextResponse.json(agents)
}
