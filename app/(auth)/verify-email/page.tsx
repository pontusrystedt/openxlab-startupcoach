import { Suspense } from "react"
import VerifyEmailRedirect from "./VerifyEmailRedirect"

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailRedirect />
    </Suspense>
  )
}
