import { prisma } from "@/lib/prisma"

interface AgentContext {
  knowledgeText: string
  startupFileText: string
}

export async function buildAgentContext(
  orgId: string,
  startupId: string,
): Promise<AgentContext> {
  const [knowledgeItems, startupFiles] = await Promise.all([
    prisma.knowledgeItem.findMany({
      where: {
        orgId,
        extractedText: { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { title: true, extractedText: true, keywords: true },
    }),
    prisma.startupFile.findMany({
      where: {
        startupId,
        extractedText: { not: null },
      },
      orderBy: { uploadedAt: "desc" },
      take: 5,
      select: { fileName: true, extractedText: true },
    }),
  ])

  const knowledgeText = knowledgeItems
    .filter((k) => k.extractedText)
    .map((k) => `### ${k.title}\n${k.extractedText}`)
    .join("\n\n")
    .slice(0, 6000)

  const startupFileText = startupFiles
    .filter((f) => f.extractedText)
    .map((f) => `### ${f.fileName}\n${f.extractedText}`)
    .join("\n\n")
    .slice(0, 6000)

  return { knowledgeText, startupFileText }
}
