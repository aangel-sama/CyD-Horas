import { supabase } from '../supabaseClient';
import { eachDayOfInterval, format, isFriday, isWeekend, startOfWeek } from 'date-fns';
import { esFeriado } from '../utils/feriados';

interface RegisterVacationInput {
  correo: string;
  motivo: string;
  fechaInicio: Date;
  fechaFin: Date;
}

export async function registerVacation({
  correo,
  motivo,
  fechaInicio,
  fechaFin,
}: RegisterVacationInput) {
  const dias = eachDayOfInterval({ start: fechaInicio, end: fechaFin });

  const diasPorSemana: Record<string, { fecha: Date; horas: number }[]> = {};

  dias.forEach((dia) => {
    if (isWeekend(dia) || esFeriado(dia)) return; // Ignorar sábado, domingo y feriados

    const lunesSemana = format(startOfWeek(dia, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const horas = isFriday(dia) ? 6.5 : 9;

    if (!diasPorSemana[lunesSemana]) diasPorSemana[lunesSemana] = [];
    diasPorSemana[lunesSemana].push({ fecha: dia, horas });
  });
// 
  const registros: any[] = [];

  const proyectoVacacion = motivo === 'Vacaciones' ? 'GIN-2 Vacaciones' : 'GIN-2 Licencias';

  // Obtener todos los proyectos asignados al correo
  const { data: proyectosAsignados, error: errorProyectos } = await supabase
    .from('proyecto')
    .select('codigo')
    .eq('correo', correo);

  if (errorProyectos || !proyectosAsignados) throw errorProyectos;

  const codigos = proyectosAsignados.map(p => p.codigo);

  for (const semana in diasPorSemana) {
    const diasSemana = diasPorSemana[semana];
    const estado = diasSemana.length === 5 ? 'Enviado' : 'Borrador';

    for (const { fecha, horas } of diasSemana) {
      for (const codigo of codigos) {
        registros.push({
          correo,
          proyecto: codigo,
          fecha: format(fecha, 'yyyy-MM-dd'),
          horas: codigo === proyectoVacacion ? horas : 0,
          estado,
        });
      }
    }
  }

  const fechasAEliminar = registros.map(r => r.fecha);

  // Eliminar los registros anteriores para esas fechas (de cualquier proyecto del usuario)
  await supabase
    .from('registro_horas')
    .delete()
    .in('fecha', fechasAEliminar)
    .eq('correo', correo);

  // Insertar los nuevos registros
  const { error } = await supabase.from('registro_horas').insert(registros);
  if (error) throw error;
}


