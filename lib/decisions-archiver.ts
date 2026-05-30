import { prisma } from "@/lib/prisma"

/**
 * Archives decisions older than 2 months where archivedAt is null and status != ARCHIVED.
 * Returns the number of archived decisions.
 */
export async function archiveOldDecisions(orgId: string): Promise<number> {
  const twoMonthsAgo = new Date()
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

  const result = await prisma.decision.updateMany({
    where: {
      orgId,
      archivedAt: null,
      status: { not: "ARCHIVED" },
      createdAt: { lt: twoMonthsAgo },
    },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
    },
  })

  return result.count
}
