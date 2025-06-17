'use client';
 
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../../lib/supabaseClient';

// Componentes reutilizables
import TablaHoras from '../components/TablaHoras';
import ResumenSemana from '../components/ResumenSemana';

// Utilidades para fechas (calcular semanas y formato)
import { obtenerFechasSemana, formatoSemana } from './../../lib/utils/fechas';

// Funciones de servicio para Supabase
import { obtenerProyectos, obtenerRegistros, insertarOActualizarRegistro } from './../../lib/service/registroService';

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
  const [textoSemana, setTextoSemana] = useState('');

  // Días de la semana en orden
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  // Correo fijo para pruebas (esto debe cambiarse por el del usuario autenticado)
  // const correo = 'malvear@cydingenieria.com'; //
  const [correo, setCorreo] = useState<string | null>(null);

  // Cuando se agregue la autenticación, se debe usar el correo del usuario autenticado
  useEffect(() => {
  const obtenerUsuario = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (user?.email) {
      setCorreo(user.email);
    } else {
      alert('No hay sesión activa. Redirigiendo...');
      // Aquí puedes redirigir si usas router
    }
  };

      obtenerUsuario();
    }, []);

  /* ───────────────────────────────
     Efecto de inicialización
  ─────────────────────────────── */
  useEffect(() => {
    // Cuando se agregue la autenticación, se debe usar el correo del usuario autenticado
    if (!correo) return;

    const init = async () => {
      // 1. Obtener proyectos del usuario
      const codigos = await obtenerProyectos(correo);
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
        const offsetSemanas = Math.floor(
          (new Date(lunesActual).getTime() - new Date(fechaPendiente).getTime()) /
            (7 * 24 * 3600_000)
        ) * -1;
        fechasMostrar = obtenerFechasSemana(offsetSemanas);
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
        }
      }

      // Aplicar la semana a mostrar y el bloqueo
      setBloqueoSemanaAnterior(bloquearAnterior);
      setFechasSemana(fechasMostrar);
      setTextoSemana(formatoSemana(fechasMostrar[0]));

      // 6. Cargar horas registradas (si existen)
      const registrosSemana = await obtenerRegistros(correo, fechasMostrar);

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
  }, []);
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
      alert(`No puedes registrar más de ${limite} h para ${diaNombre}.`);
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

        if (correo) {
          await insertarOActualizarRegistro(correo, p, fecha, horasDia, estado);
        }
      }
    }

    if (estado === 'Enviado') {
      setEstadoEnvio('Enviado');
      setBloquear(true);
      alert('Semana enviada correctamente.');
      if (bloqueoSemanaAnterior) location.reload();
    } else {
      alert('Borrador guardado.');
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
    <div className="flex bg-[#f8f9fa]">
      <Sidebar />
      <main className="ml-64 flex-1 px-10 py-8 overflow-y-auto max-h-screen">
        <h1 className="text-3xl font-bold text-[#212121] mb-6">Registro de Horas</h1>

        {bloqueoSemanaAnterior && (
          <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded">
            Primero debes completar y <b>enviar</b> la semana anterior.
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
          <button
            onClick={() => {
              if (bloquear) return alert('Registro ya enviado');
              persistir('Borrador');
            }}
            className={`btn-outline ${bloquear ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Guardar borrador
          </button>

          <button
            onClick={() => {
              if (bloquear) return alert('Registro ya enviado');
              const tot = proyectos.reduce((s, p) => s + dias.reduce((s2, d) => s2 + (horas[p]?.[d] || 0), 0), 0);
              if (tot < 42.5) {
                alert(`Debes completar al menos 42.5 h. Actualmente llevas ${tot.toFixed(1)}.`);
                return;
              }
              persistir('Enviado');
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

