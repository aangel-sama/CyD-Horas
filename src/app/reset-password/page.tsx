'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Al montar el componente extraemos el access_token del hash de la URL
  useEffect(() => {
    // location.hash viene con el formato "#access_token=…&..."
    const hash = window.location.hash.replace(/^#/, '')
    const params = new URLSearchParams(hash)
    const t = params.get('access_token')
    if (t) {
      setToken(t)
    } else {
      setError('Token de recuperación no encontrado en la URL.')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('No hay token válido para cambiar la contraseña.')
      return
    }

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    // Llamada a Supabase para aplicar la nueva contraseña
    const { error: err } = await supabase.auth.verifyOtp({
      type: 'recovery',
      token,
      newPassword: password,
    })
    setLoading(false)

    if (err) {
      setError(err.message)
    } else {
      // Éxito: redirigimos al login
      router.replace('/login')
    }
  }

  // Estado de token no válido
  if (error && !token) {
    return <div className="p-4 text-red-600">Error: {error}</div>
  }

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="pt-10 pb-6 flex justify-center">
          <img src="/cyD-logo.svg" alt="CyD Ingeniería" className="h-14" />
        </div>
        <div className="px-8 pb-8">
          <h2 className="text-center text-xl font-bold mb-4 text-black">
            Cambia tu contraseña
          </h2>

          {error && (
            <p className="text-red-600 text-center mb-4">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm text-gray-700 mb-1"
              >
                Nueva contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-700 text-black"
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="block text-sm text-gray-700 mb-1"
              >
                Repite la contraseña
              </label>
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-700 text-black"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? 'Actualizando…' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
