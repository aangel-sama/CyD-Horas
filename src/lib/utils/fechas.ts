/**
 * Devuelve un arreglo de fechas (string en formato YYYY-MM-DD) correspondiente a una semana laboral.
 * @param offsetSemanas Número de semanas a desplazar. 0 = semana actual, -1 = anterior, +1 = siguiente
 * @returns Arreglo de 5 fechas (lunes a viernes)
 */

import { FERIADOS } from './feriados';

export function esFeriado(fecha: string): boolean {
  return FERIADOS.includes(fecha);
}


export function obtenerFechasSemana(offsetSemanas = 0): string[] {
  const hoy = new Date();
  const fechaBase = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + offsetSemanas * 7);

  const diaSemana = fechaBase.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
  const distanciaAlLunes = (diaSemana + 6) % 7; // 0 si es lunes, 1 si es martes, ..., 6 si es domingo
  const lunes = new Date(fechaBase);
  lunes.setDate(fechaBase.getDate() - distanciaAlLunes);

  const fechas: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    fechas.push(d.toISOString().split('T')[0]); // YYYY-MM-DD
  }

  return fechas;
}


/**
 * Devuelve un texto formateado como "Semana del dd/mm al dd/mm"
 * @param desdeISO Fecha ISO del lunes de la semana
 * @returns Texto legible
 */
export function formatoSemana(desdeISO: string): string {
  const d = new Date(desdeISO);       // Lunes
  const f = new Date(d); f.setDate(d.getDate() + 4); // Viernes

  const fmt = (x: Date) =>
    `${x.getDate().toString().padStart(2, '0')}/${(x.getMonth() + 1).toString().padStart(2, '0')}`;

  return `Semana del ${fmt(d)} al ${fmt(f)}`;
}

export function obtenerFechasHabilesSemana(offset = 0): string[] {
  return obtenerFechasSemana(offset).filter(f => !esFeriado(f));
}

