'use client'

import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import Sidebar from '../components/Sidebar'
import { supabase } from '@/lib/supabaseClient'

dayjs.extend(isoWeek)

const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

export default function DashboardPage() {
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [entries, setEntries] = useState<Record<string, Record<string, number>>>({})
  const [loading, setLoading] = useState(true)

  // cálculo de fechas de la semana en formato YYYY-MM-DD
  const monday = dayjs().startOf('isoWeek')
  const weekDates = dias.map((_, i) => monday.add(i, 'day').format('YYYY-MM-DD'))

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return
      const userId = session.user.id

      // 1) fetch projects asignados al usuario
      const { data: assignments, error: err1 } = await supabase
        .from('project_assignments')
        .select('project_id, projects(name)')
        .eq('user_id', userId)

      if (err1) {
        console.error(err1)
        return
      }

      const proys = assignments?.map((a) => ({
        id: a.project_id,
        name: (a.projects as any).name,
      }))!

      setProjects(proys)

      // 2) fetch entradas de esta semana
      const { data: times, error: err2 } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .in('entry_date', weekDates)

      if (err2) console.error(err2)

      // 3) inicializar estado
      const init: Record<string, Record<string, number>> = {}
      proys.forEach((p) => {
        init[p.id] = {}
        weekDates.forEach((d) => {
          const e = times?.find((t) => t.project_id === p.id && t.entry_date === d)
          init[p.id][d] = e?.hours ?? 0
        })
      })
      setEntries(init)
      setLoading(false)
    }

    load()
  }, [])

  // límite 9h o 6.5h en viernes
  const limite = (date: string) => {
    return dayjs(date).isoWeekday() === 5 ? 6.5 : 9
  }

  // manejar cambio de input y upsert en Supabase
  const handleChange = async (projId: string, date: string, val: number) => {
    const sumaOtras = projects.reduce(
      (sum, p) => (p.id === projId ? sum : sum + (entries[p.id][date] || 0)),
      0
    )
    if (sumaOtras + val > limite(date)) {
      alert(`No puedes superar ${limite(date)}h en ${dayjs(date).format('dddd')}`)
      return
    }

    setEntries((e) => ({
      ...e,
      [projId]: { ...e[projId], [date]: val },
    }))

    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session!.user.id
    const { error } = await supabase.from('time_entries').upsert({
      user_id: userId,
      project_id: projId,
      entry_date: date,
      hours: val,
    })
    if (error) console.error(error)
  }

  if (loading) return <div>⏳ Cargando Dashboard…</div>

  // totales
  const totalProyecto = (projId: string) =>
    weekDates.reduce((sum, d) => sum + (entries[projId][d] || 0), 0)
  const totalDia = (d: string) =>
    projects.reduce((sum, p) => sum + (entries[p.id][d] || 0), 0)
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

        {/* Tabla */}
        <div className="overflow-auto shadow rounded bg-white">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="p-4">Proyecto</th>
                {weekDates.map((d) => (
                  <th key={d} className="p-4 text-center">
                    {dayjs(d).format('dd DD')}
                  </th>
                ))}
                <th className="p-4 text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="table-row border-b">
                  <td className="p-4 font-medium text-[#374151]">{p.name}</td>
                  {weekDates.map((d) => (
                    <td key={d} className="p-2 text-center">
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={entries[p.id][d] ?? ''}
                        onChange={(e) =>
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
                {weekDates.map((d) => (
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
