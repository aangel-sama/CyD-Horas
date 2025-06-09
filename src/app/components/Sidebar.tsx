'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Sidebar() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 bg-white border-r h-screen p-4">
      <button
        onClick={() => router.push('/dashboard')}
        className="block mb-4 font-medium hover:text-red-700"
      >
        Dashboard
      </button>
      <button onClick={handleLogout} className="text-red-600">
        Cerrar sesión
      </button>
    </aside>
  )
}
