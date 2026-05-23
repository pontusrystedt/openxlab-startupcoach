// Kör en gång vid setup: npx ts-node scripts/register-klang-webhook.ts
import "dotenv/config"

const API_HOST = "https://api.klang.ai"
const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/klang`

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
  console.log("Webhook-svar:", await res.json())
}

registerWebhook().catch(console.error)
