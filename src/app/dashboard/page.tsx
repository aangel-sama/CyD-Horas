// src/app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import Sidebar from '../components/Sidebar'
import { supabase } from '@/lib/supabaseClient'

dayjs.extend(isoWeek)

// Definimos los días como tipo literal
const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const
type Dia = typeof dias[number]

// Tipos según tu tabla en Supabase
interface Assignment {
  project_id: string
  projects: { name: string }
}
interface TimeEntry {
  project_id: string
  entry_date: string
  hours: number
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [entries, setEntries] = useState<Record<string, Record<string, number>>>({})
  const [loading, setLoading] = useState(true)

  // 1) Fechas de la semana (lunes a viernes)
  const monday = dayjs().startOf('isoWeek')
  const weekDates = dias.map((_, i) =>
    monday.add(i, 'day').format('YYYY-MM-DD')
  )

  useEffect(() => {
    async function load() {
      // 2) Sesión
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }
      const userId = session.user.id

      // 3) Fetch asignaciones
      const { data: assignments, error: err1 } = await supabase
        .from<Assignment>('project_assignments')
        .select('project_id, projects(name)')
        .eq('user_id', userId)

      if (err1 || !assignments) {
        console.error('Error cargando asignaciones', err1)
        return
      }

      const proys = assignments.map(a => ({
        id: a.project_id,
        name: a.projects.name
      }))
      setProjects(proys)

      // 4) Fetch entradas de esta semana
      const { data: times, error: err2 } = await supabase
        .from<TimeEntry>('time_entries')
        .select('project_id, entry_date, hours')
        .eq('user_id', userId)
        .in('entry_date', weekDates)

      if (err2) console.error('Error cargando time_entries', err2)

      // 5) Inicializar estado de entradas (0 si no existe)
      const init: Record<string, Record<string, number>> = {}
      proys.forEach(p => {
        init[p.id] = {}
        weekDates.forEach(d => {
          const found = times?.find(t => t.project_id === p.id && t.entry_date === d)
          init[p.id][d] = found?.hours ?? 0
        })
      })
      setEntries(init)
      setLoading(false)
    }

    load()
  }, [weekDates])

  // 6) Límite de horas según día
  const limite = (date: string) =>
    dayjs(date).isoWeekday() === 5 ? 6.5 : 9

  // 7) Handler de cambio con upsert
  const handleChange = async (projId: string, date: string, val: number) => {
    // Validamos suma de otras entradas
    const sumaOtras = projects.reduce(
      (sum, p) => (p.id === projId ? sum : sum + (entries[p.id]?.[date] || 0)),
      0
    )
    if (sumaOtras + val > limite(date)) {
      alert(
        `No puedes superar ${limite(date)}h en ${dayjs(date).format('dddd')}`
      )
      return
    }

    // Actualizar estado local
    setEntries(e => ({
      ...e,
      [projId]: { ...e[projId], [date]: val }
    }))

    // Guardar en Supabase
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const userId = session.user.id

    const { error } = await supabase
      .from('time_entries')
      .upsert({
        user_id: userId,
        project_id: projId,
        entry_date: date,
        hours: val
      })
    if (error) console.error('Error upsert time_entries', error)
  }

  if (loading) {
    return <div className="p-8">⏳ Cargando Dashboard…</div>
  }

  // 8) Cálculo de totales
  const totalProyecto = (projId: string) =>
    weekDates.reduce((sum, d) => sum + (entries[projId]?.[d] || 0), 0)

  const totalDia = (d: string) =>
    projects.reduce((sum, p) => sum + (entries[p.id]?.[d] || 0), 0)

  const totalGeneral = () =>
    projects.reduce((sum, p) => sum + totalProyecto(p.id), 0)

  return (
    <div className="min-h-screen flex bg-[#f8f9fa]">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-[#212121] mb-6">
          Registro de Horas (Semana {monday.format('WW')})
        </h1>

        {/* Contadores */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="stat-card">
            <p className="text-sm text-[#76787A]">Total esta semana</p>
            <p className="text-3xl font-bold text-[#802528]">
              {totalGeneral().toFixed(1)}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#76787A]">Proyectos activos</p>
            <p className="text-3xl font-bold text-[#802528]">
              {projects.length}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#76787A]">Estado</p>
            <p className="total-badge-extra">⏳ Sin enviar</p>
          </div>
        </div>

        {/* Tabla de entrada */}
        <div className="overflow-auto shadow rounded bg-white">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="p-4">Proyecto</th>
                {weekDates.map(d => (
                  <th key={d} className="p-4 text-center">
                    {dayjs(d).format('dd DD')}
                  </th>
                ))}
                <th className="p-4 text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id} className="table-row border-b">
                  <td className="p-4 font-medium text-[#374151]">{p.name}</td>
                  {weekDates.map(d => (
                    <td key={d} className="p-2 text-center">
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={entries[p.id]?.[d] ?? ''}
                        onChange={e =>
                          handleChange(p.id, d, parseFloat(e.target.value) || 0)
                        }
                        className="input-hora"
                      />
                    </td>
                  ))}
                  <td className="p-4 text-center">
                    <span className="total-badge">
                      {totalProyecto(p.id).toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-white text-[#212121] font-semibold">
                <td className="p-4 text-center">Total diario</td>
                {weekDates.map(d => (
                  <td key={d} className="p-4 text-center text-[#802528]">
                    {totalDia(d).toFixed(1)}
                  </td>
                ))}
                <td className="p-4 text-center">
                  <span className="total-badge">
                    {totalGeneral().toFixed(1)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </main>
    </div>
  )
}
