'use client';
 
import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { supabase } from '../../lib/supabaseClient';

// Componentes reutilizables
import TablaHoras from '../../components/TablaHoras';
import ResumenSemana from '../../components/ResumenSemana';

// Utilidades para fechas (calcular semanas y formato)
import { obtenerFechasSemana, formatoSemana, esFeriado} from '../../lib/utils/fechas';

// Funciones de servicio para Supabase
import { obtenerProyectos, obtenerRegistros, insertarOActualizarRegistro } from './../../lib/service/registroService';


// Días de la semana en orden
const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];


/* ──────────────────────────────────────────────────────────────────────────────
   Componente principal de la página: Registro de Horas
─────────────────────────────────────────────────────────────────────────────────*/
export default function RegistroHoras() {
  // Lista de códigos de proyectos asociados al usuario
  const [proyectos, setProyectos] = useState<string[]>([]);

  // Matriz de horas por proyecto y día
  const [horas, setHoras] = useState<Record<string, Record<string, number>>>({});

  // Estado del envío: si ya fue enviado o está en borrador
  const [estadoEnvio, setEstadoEnvio] = useState<'Pendiente' | 'Enviado'>('Pendiente');

  // Indica si los inputs deben estar deshabilitados
  const [bloquear, setBloquear] = useState(false);

  // Indica si se está mostrando una semana anterior no enviada
  const [bloqueoSemanaAnterior, setBloqueoSemanaAnterior] = useState(false);

  // Semana que se está mostrando (como array de fechas)
  const [fechasSemana, setFechasSemana] = useState<string[]>([]);

  // Texto amigable que se muestra como rango de la semana
  const [, setTextoSemana] = useState('');

  // Correo de usuario autenticado
  const [correo, setCorreo] = useState<string | null>(null);

  // Mensajes de error y éxito para notificaciones
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  /* ───────────────────────────────
     Efecto de inicialización
  ─────────────────────────────── */
  useEffect(() => {
    // Cuando se agregue la autenticación, se debe usar el correo del usuario autenticado
    const init = async () => {
      // 1. Obtener proyectos del usuario
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCorreo(user.email);
      } else {
        alert('No hay sesión activa.');
      } 
      const codigos = await obtenerProyectos(user?.email || '');
      setProyectos(codigos);

      // 2. Inicializar matriz de horas en cero
      const h0: Record<string, Record<string, number>> = {};
      codigos.forEach(p => {
        h0[p] = {};
        dias.forEach(d => (h0[p][d] = 0));
      });
      setHoras(h0);

      // 3. Determinar si el usuario es nuevo (sin registros)
      const { count: totalRegistros } = await supabase
        .from('registro_horas')
        .select('*', { count: 'exact', head: true })
        .eq('correo', correo);
      const usuarioNuevo = (totalRegistros || 0) === 0;

      // 4. Calcular fechas clave
      const fechasActual = obtenerFechasSemana(0);
      const fechasPrev = obtenerFechasSemana(-1);
      const lunesActual = fechasActual[0];

      // 5. Verificar si hay borradores de semanas anteriores
      const { data: todosLosBorradores } = await supabase
        .from('registro_horas')
        .select('fecha')
        .eq('correo', correo)
        .eq('estado', 'Borrador');
      const borradoresPasados = (todosLosBorradores || []).filter(r =>
        new Date(r.fecha) < new Date(lunesActual)
      );

      // Por defecto, mostrar la semana actual
      let fechasMostrar = fechasActual;
      let bloquearAnterior = false;

      // Si hay borradores anteriores, retroceder a esa semana
      if (borradoresPasados.length > 0) {
        const fechaPendiente = borradoresPasados[0].fecha;
        // Calcula el lunes de la semana de fechaPendiente
        const fecha = new Date(fechaPendiente);
        const diaSemana = fecha.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
        const distanciaAlLunes = (diaSemana + 6) % 7;
        const lunesPendiente = new Date(fecha);
        lunesPendiente.setDate(fecha.getDate() - distanciaAlLunes);

        // Calcula el lunes actual
        const hoy = new Date();
        const diaSemanaActual = hoy.getDay();
        const distanciaAlLunesActual = (diaSemanaActual + 6) % 7;
        const lunesActual = new Date(hoy);
        lunesActual.setDate(hoy.getDate() - distanciaAlLunesActual);

        // Calcula el offset de semanas respecto al lunes actual
        const diffSemanas = Math.round(
          (lunesPendiente.getTime() - lunesActual.getTime()) / (7 * 24 * 3600_000)
        );

        fechasMostrar = obtenerFechasSemana(diffSemanas);
        bloquearAnterior = true;
      }

      // Si el usuario no es nuevo, verificar si tiene registros de la semana pasada sin enviar
      // --------------- dentro de init() -----------------
      if (!usuarioNuevo) {
        // Traemos TODAS las filas (si existen) de la semana anterior
        const { data: registrosPrev } = await supabase
          .from('registro_horas')
          .select('estado')
          .eq('correo', correo)
          .in('fecha', fechasPrev);

        // ¿Hay, al menos, un registro?
        const hayDatosPrev        = (registrosPrev?.length ?? 0) > 0;
        // ¿Alguno quedó como Borrador?
        const hayBorradoresPrev   = registrosPrev?.some(r => r.estado === 'Borrador') ?? false;

        /*  ── DECISIÓN ───────────────────────────────
            ┌──────────────┬──────────────┬───────────┐
            │              │   Datos?     │  Estado   │ Resultado
            ├──────────────┼──────────────┼───────────┤
            │ Vacío        │ false        │  –        │ ✓  Semana actual
            │ Todo Enviado │ true         │  Enviado  │ ✓  Semana actual
            │ Algún Borra. │ true         │  Borrador │ ✗  Bloqueo (mostrar prev.)
            └──────────────┴──────────────┴───────────┘ */
        if (hayDatosPrev && hayBorradoresPrev) {
          fechasMostrar     = fechasPrev;
          bloquearAnterior  = true;
          setMensajeError('Primero debes completar y enviar la semana anterior.');
        }
      }

      // Aplicar la semana a mostrar y el bloqueo
      setBloqueoSemanaAnterior(bloquearAnterior);
      setFechasSemana(fechasMostrar);
      setTextoSemana(formatoSemana(fechasMostrar[0]));

      // 6. Cargar horas registradas (si existen)
      const registrosSemana = await obtenerRegistros(user?.email || '', fechasMostrar);

      if (registrosSemana.length > 0) {
        const hNew = { ...h0 };
        registrosSemana.forEach(r => {
          const idx = fechasMostrar.indexOf(r.fecha);
          if (idx !== -1) {
            const diaNombre = dias[idx];
            hNew[r.proyecto][diaNombre] = r.horas;
          }
        });
        setHoras(hNew);

        // Si algún registro está enviado, se bloquea edición
        if (registrosSemana.some(r => r.estado === 'Enviado')) {
          setEstadoEnvio('Enviado');
          setBloquear(true);
        }
      }
    };

    init();
  }, [correo]);
// Cuando se agregue la autenticación, se debe usar el correo del usuario autenticado
//}, [correo]);

  /* ───────────────────────────────
     Función para manejar cambios en inputs
  ─────────────────────────────── */
  const handleHoraChange = (proyecto: string, idxDia: number, valor: number) => {
    const hoyIdx = new Date().getDay() || 7;
    if (!bloqueoSemanaAnterior && idxDia + 1 > hoyIdx) return;

    const diaNombre = dias[idxDia];
    const limite = diaNombre === 'Viernes' ? 6.5 : 9;
    const totalDia = proyectos.reduce((acc, p) =>
      acc + (p === proyecto ? 0 : horas[p]?.[diaNombre] || 0), 0);

    if (totalDia + valor > limite) {
      setMensajeError(`No puedes registrar más de ${limite} h para ${diaNombre}.`);
      return;
    }

    setHoras(prev => ({
      ...prev,
      [proyecto]: { ...prev[proyecto], [diaNombre]: valor }
    }));
  };

  /* ───────────────────────────────
     Guardar o enviar registros
  ─────────────────────────────── */
  const persistir = async (estado: 'Borrador' | 'Enviado') => {
    const hoyIdx = new Date().getDay() || 7;

    for (const p of proyectos) {
      for (let i = 0; i < dias.length; i++) {
        if (estado === 'Borrador' && !bloqueoSemanaAnterior && i + 1 > hoyIdx) continue;

        const fecha = fechasSemana[i];
        const horasDia = horas[p][dias[i]] || 0;
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setCorreo(user.email);
        } else {
          alert('No hay sesión activa.');
        } 
        if (correo) {
          await insertarOActualizarRegistro(user?.email || '', p, fecha, horasDia, estado);
        }
      }
    }

    if (estado === 'Enviado') {
      setEstadoEnvio('Enviado');
      setBloquear(true);
      setMensajeExito('Registro enviado correctamente.');
      setMensajeError('');
      if (bloqueoSemanaAnterior) location.reload();
    } else {
      setEstadoEnvio('Pendiente');
      setBloquear(false);
      setMensajeExito('Borrador guardado correctamente.');
    }
  };

  /* ───────────────────────────────
     Render del componente principal
  ─────────────────────────────── */
  const totalGeneral = proyectos.reduce((s, p) => s + dias.reduce((s2, d) => s2 + (horas[p]?.[d] || 0), 0), 0);
  // Función que calcula el total de horas por proyecto
  const totalProyecto = (p: string) => dias.reduce((s, d) => s + (horas[p]?.[d] || 0), 0);

  // Función que calcula el total de horas por día
  const totalDia = (i: number) => proyectos.reduce((s, p) => s + (horas[p]?.[dias[i]] || 0), 0);

  return (
    <div className="flex bg-[#ffffff] min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 px-10 py-8 overflow-y-auto max-h-screen">
        <h1 className="text-3xl font-bold text-[#212121] mb-6">Registro de Horas</h1>
        {/* Mensajes de error y éxito */}
        {mensajeError && (
            <div className="relative mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
              <button
                onClick={() => setMensajeError('')}
                className="absolute top-2 right-2 text-red-700 hover:text-red-900 text-lg font-bold focus:outline-none"
                aria-label="Cerrar"
                type="button"
              >
                ×
              </button>
              {mensajeError}
            </div>
          )}

          {mensajeExito && (
            <div className="relative mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
              <button
                onClick={() => setMensajeExito('')}
                className="absolute top-2 right-2 text-green-700 hover:text-green-900 text-lg font-bold focus:outline-none"
                aria-label="Cerrar"
                type="button"
              >
                ×
              </button>
              {mensajeExito}
            </div>
          )}

        {/* Contadores de resumen */}
        <ResumenSemana
          totalGeneral={() =>totalGeneral}
          cantidadProyectos={proyectos.length}
          estado={estadoEnvio}
        />

        {/* Tabla de ingreso de horas */}
        <TablaHoras
          proyectos={proyectos}
          horas={horas}
          dias={dias}
          fechasSemana={fechasSemana}
          estadoEnvio={estadoEnvio}
          bloquear={bloquear}
          bloqueoSemanaAnterior={bloqueoSemanaAnterior}
          totalProyecto={totalProyecto}
          totalDia={totalDia}
          totalGeneral={() => totalGeneral}
          handleHoraChange={handleHoraChange}
        />


        {/* Botones de acción */}
        <div className="flex justify-end w-full gap-4 mt-6">
        {/* BOTÓN GUARDAR BORRADOR */}
          <button
            onClick={() => {
              if (bloquear) {
                setMensajeError('Registro ya enviado.');
                setMensajeExito('');
                return;
              }

              // limpiar alertas anteriores
              setMensajeError('');
              setMensajeExito('');

              persistir('Borrador');
              setMensajeExito('Borrador guardado.');
            }}
            className={`btn-outline ${bloquear ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Guardar borrador
          </button>

          {/* BOTÓN ENVIAR REGISTRO */}
          <button
            onClick={() => {
              if (bloquear) {
                setMensajeError('Registro ya enviado.');
                setMensajeExito('');
                return;
              }

              const tot = proyectos.reduce(
                (s, p) => s + dias.reduce((s2, d) => s2 + (horas[p]?.[d] || 0), 0),
                0
              );
              const diasHabiles = fechasSemana.filter(f => {
                const d = new Date(f).getUTCDay();
                return d >= 1 && d <= 5 && !esFeriado(f); // Lunes a viernes y no feriado
              });
              const horasEsperadas = diasHabiles.reduce((t, f) => {
                const d = new Date(f).getUTCDay();
                return t + (d === 5 ? 6.5 : 9);
              }, 0);

              if (tot < horasEsperadas) {
                setMensajeError(
                  `Debes completar al menos ${horasEsperadas} h. Actualmente llevas ${tot.toFixed(1)} h.`
                );
                setMensajeExito('');
                return;
              }

              // limpiar alertas anteriores
              setMensajeError('');
              setMensajeExito('');

              persistir('Enviado');
              setMensajeExito('Semana enviada correctamente.');
            }}
            className={`btn-primary ${bloquear ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Enviar registro
          </button>
        </div>
      </main>
    </div>
  );
}

