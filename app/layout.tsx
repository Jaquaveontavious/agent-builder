import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgentForge — Build AI Agents in 60 Seconds',
  description: 'Describe what you need. AgentForge builds, configures, and runs a custom AI agent for you.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
