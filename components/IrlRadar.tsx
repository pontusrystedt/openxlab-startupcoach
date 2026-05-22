"use client"

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

interface IrlProfile {
  crl: number
  trl: number
  brl: number
  iprl: number
  frl: number
  orl: number
}

interface Props {
  current: IrlProfile
  previous?: IrlProfile
}

const LABELS = {
  crl: "Kund",
  trl: "Teknik",
  brl: "Affär",
  iprl: "IP",
  frl: "Funding",
  orl: "Org",
}

export function IrlRadar({ current, previous }: Props) {
  const data = Object.entries(LABELS).map(([key, label]) => ({
    dimension: label,
    current: current[key as keyof IrlProfile],
    previous: previous?.[key as keyof IrlProfile],
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
        <Radar
          name="Nu"
          dataKey="current"
          stroke="#1D9E75"
          fill="#1D9E75"
          fillOpacity={0.2}
        />
        {previous && (
          <Radar
            name="Förra"
            dataKey="previous"
            stroke="#B4B2A9"
            fill="#B4B2A9"
            fillOpacity={0.1}
            strokeDasharray="4 2"
          />
        )}
        <Tooltip
          formatter={(value, name) => [
            `${value}/9`,
            name === "current" ? "Nu" : "Föregående",
          ]}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
