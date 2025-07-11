'use client';

import React from 'react';
import { esFeriado } from '../lib/utils/feriados'; 
import Image from 'next/image'

// Definimos los props que este componente va a recibir desde el padre
type TablaHorasProps = {
  proyectos: string[];                                           // Lista de proyectos 
  metaMap: Record<string,string>;                                // Mapa de códigos de proyectos a nombres amigables
  dias: string[];                                                // Lista de días (Lunes a Viernes)
  horas: Record<string, Record<string, number>>;                 // Matriz de horas por proyecto y día
  fechasSemana: string[];                                        // Fechas de lunes a viernes de la semana visible
  estadoEnvio: 'Pendiente' | 'Enviado';                          // Estado actual del registro
  bloquear: boolean;                                             // Si ya fue enviado, se bloquean inputs
  bloqueoSemanaAnterior: boolean;                                // Si se debe completar semana anterior
  totalProyecto: (p: string) => number;                          // Función que calcula total de un proyecto
  totalDia: (i: number) => number;                               // Función que calcula total por día
  totalGeneral: () => number;                                    // Función que calcula total general de horas
  handleHoraChange: (proyecto: string, idxDia: number, valor: number) => void; // Función para manejar cambios
};

// Componente funcional de la tabla
export default function TablaHoras({
  proyectos,
  metaMap,
  dias,
  horas,
  fechasSemana,
  estadoEnvio,
  bloquear,
  bloqueoSemanaAnterior,
  totalProyecto,
  totalDia,
  totalGeneral,
  handleHoraChange,
}: TablaHorasProps) {
  return (
    <div className="w-full overflow-hidden rounded-2xl shadow">
      {/* Encabezado de tabla con título y semana */}
      <div className="flex items-center justify-between bg-[#fff] px-6 pt-6">
        <h2 className="text-xl font-semibold text-[#212121]">Detalle de horas</h2>
        <div className="flex items-center gap-2 text-sm text-[#802528] font-medium">
          <Image src="/today-outline.svg" alt="Calendario" width={16} height={16} className="w-4 h-4" />
          <span>{fechasSemana.length > 0 ? `Semana del ${fechasSemana[0]}` : ''}</span>
        </div>
      </div>

      {/* Tabla de ingreso de horas */}
      <table className="min-w-full bg-white">
        <thead className="table-header">
          <tr>
            <th className="p-4 text-center">Proyecto</th>
            <th className="p-4 text-center">Nombre</th>
            {/* Encabezado con días */}
            {dias.map((dia) => (
              <th key={dia} className="p-4 text-center">{dia}</th>
            ))}
            <th className="p-4 text-center">Total</th>
          </tr>
        </thead>

        <tbody>
          {/* Filas por proyecto */}
          {proyectos.map((proyecto) => (
            <tr key={proyecto} className="table-row border-b border-[#DCDDDE]">
              <td className="p-4 text-center font-medium text-[#374151]">{proyecto}</td>
              <td className="p-4 text-center text-[#6B7280]">{metaMap[proyecto] ?? '-'}</td>
              {/* Celdas de cada día con input numérico */}
              {dias.map((dia, idx) => (
                <td key={dia} className="p-2 text-center">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={horas[proyecto]?.[dia] || ''}
                    // Reglas de bloqueo:
                    // 1. Si fue enviado
                    // 2. Si es semana anterior y ya está enviada
                    // 3. Si es día futuro en semana actual
                    disabled={
                      bloquear ||
                      (fechasSemana[idx] && !isNaN(new Date(fechasSemana[idx]).getTime()) && esFeriado(new Date(fechasSemana[idx]))) ||
                      (bloqueoSemanaAnterior && estadoEnvio === 'Enviado') ||
                      (!bloqueoSemanaAnterior && idx + 1 > (new Date().getDay() || 7))
                    }

                    // Al cambiar el valor, actualiza la celda correspondiente
                    onChange={(e) =>
                      handleHoraChange(proyecto, idx, parseFloat(e.target.value) || 0)
                    }
                    className="input-hora"
                  />
                </td>
              ))}

              {/* Total por proyecto */}
              <td className="p-4 text-center">
                <span className="total-badge">{totalProyecto(proyecto).toFixed(1)}</span>
              </td>
            </tr>
          ))}
        </tbody>

        {/* Fila de totales por día y general */}
        <tfoot>
          <tr className="bg-white text-[#212121] font-semibold">
            <td className="p-4 text-center">Total diario</td>
            <td className="p-4 text-center"></td>
            {dias.map((_, i) => (
              <td key={i} className="p-4 text-center text-[#802528]">
                {totalDia(i).toFixed(1)}
              </td>
            ))}
            <td className="p-4 text-center">
              <span className="total-badge">{totalGeneral().toFixed(1)}</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
