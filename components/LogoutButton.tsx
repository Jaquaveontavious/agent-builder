'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createBrowserClientHelper } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createBrowserClientHelper()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <button
      onClick={() => void handleLogout()}
      className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:block">Log out</span>
    </button>
  )
}
