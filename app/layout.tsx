import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PropIQ — AI Real Estate Back Office',
  description: 'Find deals, pull comps, and estimate ARV in plain English. AI-powered real estate for wholesalers, flippers, and agents.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-[#060608]">
      <body className="antialiased bg-[#060608] text-slate-100">{children}</body>
    </html>
  )
}
