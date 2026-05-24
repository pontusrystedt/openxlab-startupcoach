// Kör en gång vid setup: npx tsx scripts/register-klang-webhook.ts
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const API_HOST = "https://app.klang.ai"
const WEBHOOK_URL = process.env.KLANG_WEBHOOK_URL
  ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/klang`

async function registerWebhook() {
  const res = await fetch(`${API_HOST}/api/v1/resthook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.KLANG_API_KEY!}`,
    },
    body: JSON.stringify({
      hookUrl: WEBHOOK_URL,
      type: "transcriptionFinished",
    }),
  })
  const text = await res.text()
  console.log("Status:", res.status)
  console.log("Svar:", text)
  console.log("API-nyckel (första 8 tecken):", process.env.KLANG_API_KEY?.slice(0, 8))
}

registerWebhook().catch(console.error)
