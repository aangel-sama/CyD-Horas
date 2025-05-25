'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

export default function RegisterSuccessPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    // Esto lee el access_token del hash y lo guarda en localStorage
    supabase.auth.getSession()
      .then((result: { data: any; error: { message: string } | null }) => {
        if (result.error) setError(result.error.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Confirmando tu cuenta…</div>
  if (error) return <div className="text-red-600">Error: {error}</div>

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-8 bg-white">
      <Image src="/logo_cyd.png" alt="Logo CyD" width={100} height={100} />

      <div className="w-full max-w-lg p-6 shadow-lg bg-white text-center">
        <div className="flex items-center justify-center mb-2 text-lg font-medium text-gray-900">
          <Image src="/check.png" alt="Check" width={16} height={16} className="mr-2" />
          ¡Éxito!
        </div>
        <div className="mb-5 text-sm text-gray-600">
          Tu cuenta ha sido confirmada correctamente.
        </div>
        <button
          onClick={() => router.push('/login')}
          className="w-full py-3 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 transition"
        >
          Iniciar sesión
        </button>
      </div>
    </div>
  )
}
