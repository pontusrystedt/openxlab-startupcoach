import { requireCoach } from "@/lib/access"
import TotpSetupClient from "./TotpSetupClient"

export default async function TotpSetupPage() {
  const session = await requireCoach()
  const totpEnabled = session.user.totpEnabled ?? false

  return <TotpSetupClient totpEnabled={totpEnabled} />
}
