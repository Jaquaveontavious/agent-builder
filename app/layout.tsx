import type { Metadata } from 'next'
import './globals.css'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Iron Operative — AI Agent Platform',
  description: 'Deploy AI operative suites that run your business backend automatically. PropIQ, Content Suite, and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-[#0a0a0f]">
      <body className="antialiased bg-[#0a0a0f] text-slate-100 flex flex-col min-h-screen">
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}
