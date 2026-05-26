import { prisma } from "@/lib/prisma"

interface AgentContext {
  knowledgeText: string
  startupFileText: string
  projectFileText: string
}

export async function buildAgentContext(
  orgId: string,
  startupId: string,
): Promise<AgentContext> {
  // Hitta projektId:n som denna startup tillhör
  const projectLinks = await prisma.startupFunderProject.findMany({
    where: { startupId },
    select: { projectId: true },
  })
  const projectIds = projectLinks.map((p) => p.projectId)

  const [knowledgeItems, startupFiles, projectFiles] = await Promise.all([
    prisma.knowledgeItem.findMany({
      where: { orgId, extractedText: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { title: true, extractedText: true, keywords: true },
    }),
    prisma.startupFile.findMany({
      where: { startupId, extractedText: { not: null } },
      orderBy: { uploadedAt: "desc" },
      take: 5,
      select: { fileName: true, title: true, extractedText: true },
    }),
    projectIds.length > 0
      ? prisma.funderProjectFile.findMany({
          where: { projectId: { in: projectIds }, extractedText: { not: null } },
          orderBy: { uploadedAt: "desc" },
          take: 5,
          select: { fileName: true, title: true, extractedText: true },
        })
      : Promise.resolve([]),
  ])

  const knowledgeText = knowledgeItems
    .filter((k) => k.extractedText)
    .map((k) => `### ${k.title}\n${k.extractedText}`)
    .join("\n\n")
    .slice(0, 6000)

  const startupFileText = startupFiles
    .filter((f) => f.extractedText)
    .map((f) => `### ${f.fileName ?? f.title}\n${f.extractedText}`)
    .join("\n\n")
    .slice(0, 6000)

  const projectFileText = projectFiles
    .filter((f) => f.extractedText)
    .map((f) => `### ${f.fileName ?? f.title}\n${f.extractedText}`)
    .join("\n\n")
    .slice(0, 4000)

  return { knowledgeText, startupFileText, projectFileText }
}
