// src/components/Sidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Rutas donde NO queremos mostrar el sidebar
  const publicPaths = ['/login', '/register', '/register/success', '/forgot-password', '/login/reset-password']

  useEffect(() => {
    // Si estamos en una ruta pública, no cargamos nada
    if (publicPaths.some(p => pathname.startsWith(p))) {
      setLoading(false)
      return
    }
    // Si no, intentamos obtener la sesión
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Si no hay sesión, redirigimos al login
        router.replace('/login')
      } else {
        setEmail(session.user.email ?? null)
      }
    }).finally(() => {
      setLoading(false)
    })
  }, [pathname, router])

  if (loading) return null
  // Si es ruta pública, no renderizamos nada
  if (publicPaths.some(p => pathname.startsWith(p))) return null

  const items = [
    { href: '/registro-horas', icon: '/Resultados-b.svg', label: 'Registro de horas' },
    { href: '/dias-libres',   icon: '/Schedule-b.svg',   label: 'Registro de días libres' },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-[#802528] text-white flex flex-col justify-between p-4 z-50">
      <div>
        <div className="flex justify-center mb-8">
          <img src="/Logo_CyD_blanco.svg" alt="CyD Ingeniería" className="h-14" />
        </div>

        {email && (
          <p className="mb-6 px-3 text-sm text-white/80">
            {email}
          </p>
        )}

        <nav className="space-y-2">
          {items.map(({ href, icon, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 p-2 rounded ${
                  active ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <img src={icon} alt={label} className="w-5 h-5" />
                <span className="text-sm">{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-2 rounded hover:bg-white/10 w-full"
        >
          <img src="/exit-b.svg" alt="Cerrar sesión" className="w-5 h-5" />
          <span className="text-sm">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
