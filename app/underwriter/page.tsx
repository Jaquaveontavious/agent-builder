'use client'
import AgentPage from '@/components/AgentPage'
import { Calculator } from 'lucide-react'

export default function UnderwriterPage() {
  return (
    <AgentPage
      title="Underwriter"
      subtitle="Flip & rental analysis"
      placeholder="123 Main St, Phoenix AZ 85001 — rehab budget $30,000, asking price $220,000"
      apiRoute="/api/propiq/underwriter"
      icon={Calculator}
      iconColor="text-emerald-400"
      examples={[
        '5635 N 35th Dr, Phoenix AZ 85019 — rehab $25,000, asking $375,000',
        '623 Montevista St SW, Atlanta GA 30310 — rehab $40,000, asking $249,900',
        '1343 Willow Trl SW, Atlanta GA 30311 — rehab $35,000, asking $318,000',
      ]}
    />
  )
}
