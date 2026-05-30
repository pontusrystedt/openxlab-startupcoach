import { requireCoach } from "@/lib/access"
import DecisionsClient from "./DecisionsClient"

export default async function DecisionsPage() {
  await requireCoach()
  return <DecisionsClient />
}
