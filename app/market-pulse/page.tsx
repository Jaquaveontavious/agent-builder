'use client'
import AgentPage from '@/components/AgentPage'
import { TrendingUp } from 'lucide-react'

export default function MarketPulsePage() {
  return (
    <AgentPage
      title="Market Pulse"
      subtitle="Zip code market snapshot"
      placeholder="85019 — or try a city like Phoenix AZ or Atlanta GA 30310"
      apiRoute="/api/propiq/market-pulse"
      icon={TrendingUp}
      iconColor="text-blue-400"
      examples={[
        'Zip code 85019 — Phoenix AZ',
        'Zip code 30310 — Atlanta GA',
        'Zip code 77008 — Houston TX',
      ]}
    />
  )
}
