import { Mistral } from "@mistralai/mistralai"
import { prisma } from "@/lib/prisma"
import { encrypt } from "@/lib/crypto"
import { buildAgentContext } from "./context"
import crypto from "crypto"

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! })

// Parsar [LOCKED]...[/LOCKED] och [CUSTOMIZABLE]...[/CUSTOMIZABLE] ur template.
// Mergar: personality-prefix + låst kärna + org-specifik override.
function buildSystemPrompt(
  template: string,
  override: string | null | undefined,
  agent: { name: string; title: string | null; bio: string | null; personality: string | null },
  ctx: { displayName: string; orgName: string }
): string {
  const lockedMatch = template.match(/\[LOCKED\]([\s\S]*?)\[\/LOCKED\]/)
  const locked = lockedMatch ? lockedMatch[1].trim() : template

  const customizable = override?.trim() ?? ""

  // Ersätt platshållare i låst del
  const injected = locked
    .replace(/\{\{agentName\}\}/g, ctx.displayName)
    .replace(/\{\{orgName\}\}/g, ctx.orgName)

  // Bygg personality-prefix
  const parts: string[] = []
  if (agent.title)       parts.push(`Du spelar rollen som ${ctx.displayName} — ${agent.title}.`)
  if (agent.bio)         parts.push(`Din bakgrund: ${agent.bio}`)
  if (agent.personality) parts.push(`Din personlighet och kommunikationsstil: ${agent.personality}`)
  const personalityPrefix = parts.length > 0 ? parts.join("\n") + "\n\n---\n\n" : ""

  return [personalityPrefix + injected, customizable].filter(Boolean).join("\n\n")
}

export interface AgentRunOptions {
  agentSlug: string
  startupId: string
  orgId: string
  userMessage: string
  sessionId?: string
  meetingId?: string
  trigger?: string
  encryptOutput?: boolean
}

export interface AgentRunResult {
  output: string
  invocationId: string
  agentName: string
}

export async function runAgent(options: AgentRunOptions): Promise<AgentRunResult> {
  const {
    agentSlug,
    startupId,
    orgId,
    userMessage,
    sessionId,
    meetingId,
    trigger = "manual",
    encryptOutput = false,
  } = options

  const startTime = Date.now()

  // Hämta AgentTemplate + org-specifik AgentConfig i en query
  const template = await prisma.agentTemplate.findFirst({
    where: { slug: agentSlug, isActive: true },
    include: {
      agentConfigs: {
        where: { orgId, isActive: true },
      },
    },
  })
  if (!template) throw new Error(`Agent '${agentSlug}' finns inte eller är inaktiv`)

  const config = template.agentConfigs[0] ?? null

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { name: true },
  })

  const systemPrompt = buildSystemPrompt(
    template.systemPromptTemplate,
    config?.systemPromptOverride,
    template,
    { displayName: config?.displayName ?? template.name, orgName: org.name }
  )

  // Samlingar: config.assignedCollections om satt, annars template.defaultCollections
  const collections =
    config?.assignedCollections?.length
      ? config.assignedCollections
      : template.defaultCollections.length > 0
      ? template.defaultCollections
      : [template.knowledgeCollection]

  const { knowledgeText, startupFileText } = await buildAgentContext(
    orgId,
    startupId,
    collections
  )

  const fullUserMessage = [
    knowledgeText    ? `--- Relevant kunskap ---\n${knowledgeText}`       : "",
    startupFileText  ? `--- Startupens dokument ---\n${startupFileText}` : "",
    `--- Fråga/kontext ---\n${userMessage}`,
  ]
    .filter(Boolean)
    .join("\n\n")

  const inputHash  = crypto.createHash("sha256").update(fullUserMessage).digest("hex")

  const response = await client.chat.complete({
    model: "mistral-large-latest",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: fullUserMessage },
    ],
    temperature: 0.3,
    maxTokens: template.maxTokens,
  })

  const output =
    (response.choices?.[0]?.message?.content as string | undefined) ?? ""
  const outputHash = crypto.createHash("sha256").update(output).digest("hex")
  const latencyMs  = Date.now() - startTime

  let encryptedOutput: string | undefined
  let outputIv: string | undefined
  let outputAuthTag: string | undefined

  if (encryptOutput) {
    const enc = encrypt(output)
    encryptedOutput = enc.encryptedText
    outputIv        = enc.iv
    outputAuthTag   = enc.authTag
  }

  const invocation = await prisma.agentInvocation.create({
    data: {
      agentSlug,
      agentTemplateId: template.id,
      startupId,
      orgId,
      sessionId,
      meetingId,
      trigger,
      inputHash,
      outputHash,
      encryptedOutput,
      outputIv,
      outputAuthTag,
      rawOutput: encryptOutput ? null : output,
      latencyMs,
    },
  })

  return {
    output,
    invocationId: invocation.id,
    agentName: config?.displayName ?? template.name,
  }
}

export async function getAvailableAgents(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { agentTiers: true },
  })
  const allowedTiers = org?.agentTiers ?? ["standard"]

  // Hämta templates + org-config i en query
  const templates = await prisma.agentTemplate.findMany({
    where: {
      isActive: true,
      tier: { in: allowedTiers },
    },
    include: {
      agentConfigs: {
        where: { orgId, isActive: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  })

  // Forma om till samma struktur som frontend förväntar sig
  return templates.map((t) => {
    const config = t.agentConfigs[0] ?? null
    return {
      ...t,
      name:         config?.displayName ?? t.name,
      systemPrompt: config?.systemPromptOverride
        ? buildSystemPrompt(t.systemPromptTemplate, config.systemPromptOverride, t, {
            displayName: config.displayName,
            orgName: "",
          })
        : t.systemPromptTemplate,
      // Ta bort agentConfigs från output
      agentConfigs: undefined,
    }
  })
}
