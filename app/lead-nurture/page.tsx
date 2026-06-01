'use client'
import AgentPage from '@/components/AgentPage'
import { Users } from 'lucide-react'

export default function LeadNurturePage() {
  return (
    <AgentPage
      title="Lead Nurture"
      subtitle="3-touch follow-up sequences"
      placeholder="Lead name, property address, their situation — motivated seller, inherited property, behind on taxes, etc."
      apiRoute="/api/propiq/lead-nurture"
      icon={Users}
      iconColor="text-rose-400"
      examples={[
        'Lead: Maria Gonzalez. Property: 7123 W Hazelwood St, Phoenix AZ 85033. Situation: absentee landlord, 141 days on market, LLC owner. I called once last week, no answer.',
        'Lead: James Porter. Property: 1847 Elm St, Dallas TX 75208. Situation: inherited the house from his mother, does not want to manage it, lives out of state. Has not listed yet.',
        'Lead: Unknown owner (B&W Capital LLC). Property: 623 Montevista St SW, Atlanta GA 30310. Situation: LLC flip that has been sitting 131 days. Thin margin, they may be motivated.',
      ]}
    />
  )
}
