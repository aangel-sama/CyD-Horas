/**
 * Devuelve un arreglo de fechas (string en formato YYYY-MM-DD) correspondiente a una semana laboral.
 * @param offsetSemanas Número de semanas a desplazar. 0 = semana actual, -1 = anterior, +1 = siguiente
 * @returns Arreglo de 5 fechas (lunes a viernes)
 */
export function obtenerFechasSemana(offsetSemanas = 0): string[] {
  const base = new Date(); // Fecha actual
  base.setDate(base.getDate() + offsetSemanas * 7); // Desplazamiento de semanas

  const dow = base.getDay(); // Día de la semana (domingo = 0)
  const diff = base.getDate() - dow + (dow === 0 ? -6 : 1); // Calcular lunes
  const lunes = new Date(base.setDate(diff));

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
