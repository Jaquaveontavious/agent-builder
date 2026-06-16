import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-800/60 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">
              © {new Date().getFullYear()} Iron Operative. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Terms</Link>
            <Link href="/privacy" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Privacy</Link>
          </div>
        </div>
        <p className="text-[11px] text-slate-700 leading-relaxed mt-4 max-w-3xl">
          AI Disclaimer: Iron Operative uses artificial intelligence to generate content, documents, quotes, proposals, and other business materials. All AI-generated outputs are provided for reference only and should be reviewed and verified by the user before use. Iron Operative makes no warranties regarding the accuracy, completeness, or fitness of AI-generated content for any particular purpose. Users are solely responsible for any actions taken based on AI-generated outputs. Iron Operative is not liable for errors, omissions, or outcomes resulting from the use of generated content.
        </p>
      </div>
    </footer>
  )
}
