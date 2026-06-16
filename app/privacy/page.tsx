import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-10 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: June 2025</p>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h2>
            <p>We collect the following information when you use Iron Operative:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-slate-200">Account information:</strong> email address and password (encrypted) when you register</li>
              <li><strong className="text-slate-200">Usage data:</strong> prompts submitted to AI operatives, generated outputs, operative configurations</li>
              <li><strong className="text-slate-200">Payment information:</strong> processed securely by Stripe — we never store card numbers</li>
              <li><strong className="text-slate-200">Technical data:</strong> browser type, IP address, and usage logs for platform security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To operate and improve the Platform</li>
              <li>To process payments and manage subscriptions</li>
              <li>To power AI operative memory across sessions</li>
              <li>To send account-related communications (no marketing without consent)</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. AI and Data Processing</h2>
            <p>Prompts and content you submit to your AI operatives are sent to Anthropic's API for processing. Anthropic's usage policies apply to this data. We do not sell your prompts or outputs to third parties. Operative memory is stored in our database and used solely to improve your operative's responses across sessions.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Data Sharing</h2>
            <p>We do not sell your personal data. We share data only with:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-slate-200">Anthropic</strong> — for AI processing (prompts and responses)</li>
              <li><strong className="text-slate-200">Stripe</strong> — for payment processing</li>
              <li><strong className="text-slate-200">Supabase</strong> — for secure data storage</li>
            </ul>
            <p className="mt-3">All third-party providers are bound by their own privacy policies and data processing agreements.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Data Retention</h2>
            <p>We retain your account data and operative outputs for as long as your account is active. You may delete your operative memory at any time from the operative settings. Account deletion requests can be submitted to <a href="mailto:support@ironoperative.com" className="text-blue-400 hover:text-blue-300">support@ironoperative.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Security</h2>
            <p>We use industry-standard security practices including encrypted connections (HTTPS), row-level security on all database tables, and encrypted authentication tokens. No system is 100% secure — use a strong, unique password for your account.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data at any time. Contact us at <a href="mailto:support@ironoperative.com" className="text-blue-400 hover:text-blue-300">support@ironoperative.com</a> to make a request.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Contact</h2>
            <p>Privacy questions or requests: <a href="mailto:support@ironoperative.com" className="text-blue-400 hover:text-blue-300">support@ironoperative.com</a></p>
          </section>

        </div>
      </div>
    </div>
  )
}
