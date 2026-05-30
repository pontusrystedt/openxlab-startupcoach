import { Mistral } from "@mistralai/mistralai"
import { prisma } from "@/lib/prisma"
import { encrypt } from "@/lib/crypto"
import { buildAgentContext } from "./context"
import crypto from "crypto"

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! })

function buildPersonalityPrefix(agent: {
  name: string
  title: string | null
  bio: string | null
  personality: string | null
}): string {
  if (!agent.bio && !agent.personality && !agent.title) return ""
  const parts: string[] = []
  if (agent.title) parts.push(`Du spelar rollen som ${agent.name} — ${agent.title}.`)
  if (agent.bio) parts.push(`Din bakgrund: ${agent.bio}`)
  if (agent.personality) parts.push(`Din personlighet och kommunikationsstil: ${agent.personality}`)
  return parts.join("\n") + "\n\n---\n\n"
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

  // Hämta agentdefinition från registret (org-specifik eller global)
  const agent = await prisma.agentRegistry.findFirst({
    where: {
      slug: agentSlug,
      isActive: true,
      OR: [{ orgId }, { orgId: null }],
    },
  })
  if (!agent) throw new Error(`Agent '${agentSlug}' finns inte eller är inaktiv`)

  // Bygg kontext: generellt + agentens specifika samling
  const { knowledgeText, startupFileText } = await buildAgentContext(
    orgId,
    startupId,
    agent.knowledgeCollection
  )

  const fullUserMessage = [
    knowledgeText ? `--- Relevant kunskap ---\n${knowledgeText}` : "",
    startupFileText ? `--- Startupens dokument ---\n${startupFileText}` : "",
    `--- Fråga/kontext ---\n${userMessage}`,
  ]
    .filter(Boolean)
    .join("\n\n")

  const inputHash = crypto.createHash("sha256").update(fullUserMessage).digest("hex")

  const fullSystemPrompt = buildPersonalityPrefix(agent) + agent.systemPrompt

  const response = await client.chat.complete({
    model: "mistral-large-latest",
    messages: [
      { role: "system", content: fullSystemPrompt },
      { role: "user", content: fullUserMessage },
    ],
    temperature: 0.3,
    maxTokens: agent.maxTokens,
  })

  const output =
    (response.choices?.[0]?.message?.content as string | undefined) ?? ""
  const outputHash = crypto.createHash("sha256").update(output).digest("hex")
  const latencyMs = Date.now() - startTime

  let encryptedOutput: string | undefined
  let outputIv: string | undefined
  let outputAuthTag: string | undefined

  if (encryptOutput) {
    const enc = encrypt(output)
    encryptedOutput = enc.encryptedText
    outputIv = enc.iv
    outputAuthTag = enc.authTag
  }

  const invocation = await prisma.agentInvocation.create({
    data: {
      agentSlug,
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
    agentName: agent.name,
  }
}

export async function getAvailableAgents(orgId: string) {
  return prisma.agentRegistry.findMany({
    where: {
      isActive: true,
      OR: [{ orgId }, { orgId: null }],
    },
    orderBy: { sortOrder: "asc" },
  })
}
