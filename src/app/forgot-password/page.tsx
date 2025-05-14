// src/app/forgot-password/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    })

    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setMessage(
        'Si ese correo está registrado, recibirás un email para restablecer tu contraseña.'
      )
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Logo CyD */}
        <div className="pt-10 pb-6 flex justify-center">
          <img src="/cyD-logo.svg" alt="CyD Ingeniería" className="h-14" />
        </div>
        <div className="px-8 pb-8">
          <h1 className="text-center text-xl font-bold mb-2 text-black">
            Recuperar contraseña
          </h1>
          <p className="text-center text-gray-500 mb-6">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          {error && (
            <p className="text-red-600 text-center mb-4">{error}</p>
          )}
          {message && (
            <p className="text-green-600 text-center mb-4">{message}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@company.com"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-700 text-black"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            ¿Recordaste tu contraseña?{' '}
            <a
              href="/login"
              className="text-red-700 hover:underline font-medium"
            >
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
