"use client"

import { createAvatar } from "@dicebear/core"
import {
  lorelei,
  avataaars,
  micah,
  notionists,
  personas,
} from "@dicebear/collection"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const STYLES: Record<string, any> = {
  lorelei,
  avataaars,
  micah,
  notionists,
  personas,
}

interface Props {
  slug: string
  avatarStyle?: string
  avatarSeed?: string
  size?: number
  className?: string
}

export function AgentAvatar({
  slug,
  avatarStyle = "lorelei",
  avatarSeed,
  size = 48,
  className = "",
}: Props) {
  const style = STYLES[avatarStyle] ?? lorelei
  const seed = avatarSeed ?? slug

  const avatar = createAvatar(style, {
    seed,
    size,
    backgroundColor: ["f0f4ff", "fff0f4", "f0fff4", "fffff0", "f4f0ff"],
    backgroundType: ["solid"],
  })

  const svgString = avatar.toString()

  return (
    <div
      className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svgString }}
      aria-label={`Avatar för ${slug}`}
    />
  )
}
