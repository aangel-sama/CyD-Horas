'use client';

import Sidebar from '../components/Sidebar';
import CalendarioFecha from '../components/CalendarioFecha';
import { registerVacation } from '../../lib/utils/registerVacation';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function RegistroDiasLibres() {
  const [motivo, setMotivo] = useState('Vacaciones');
  const [fechaInicio, setFechaInicio] = useState<Date>();
  const [fechaFin, setFechaFin] = useState<Date>();
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');


  const [correoUsuario, setCorreoUsuario] = useState<string>('');

  useEffect(() => {
    const obtenerUsuario = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setCorreoUsuario(data.user.email || '');
      } else {
        console.error('No se pudo obtener el usuario:', error);
      }
    };

    obtenerUsuario();
  }, []);

  const handleEnviar = async () => {
  // Validaciones básicas
    if (!fechaInicio || !fechaFin) {
      setMensajeError('Debes seleccionar ambas fechas.');
      return;
    }
    if (fechaFin < fechaInicio) {
      setMensajeError('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }
    if (!correoUsuario) {
      setMensajeError('No se pudo determinar tu correo. Intenta de nuevo.');
      return;
    }

    try {
      await registerVacation({
        correo: correoUsuario,
        motivo,
        fechaInicio,
        fechaFin,
      });

      setMensajeError('');
      setMensajeExito('Vacaciones registradas exitosamente.');
      setMotivo('Vacaciones');
      setFechaInicio(undefined);
      setFechaFin(undefined);
    } catch (error) {
      console.error(error);
      setMensajeError('Error al registrar los días libres.');
    }
  };

  return (
    <div className="flex bg-[#ffffff] min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 px-10 py-12 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center px-4">
          <h1 className="text-3xl font-bold text-[#212121] mb-8">Registro de días libres</h1>

          {mensajeError && (
            <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
              {mensajeError}
            </div>
          )}

          {mensajeExito && (
            <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
              {mensajeExito}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-26 w-full max-w-4xl">
            <div className="flex items-center gap-16">
              {/* Motivo */}
              <div className="flex flex-col gap-1">
                <label className="text-sm text-[#212121]">Motivo</label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="border-white rounded px-4 py-2 text-sm bg-white shadow text-[#76787A] outline-none focus:ring-0 focus:border-transparent"
                >
                  <option value="Vacaciones">Vacaciones</option>
                  <option value="Licencia médica">Licencia médica</option>
                </select>
              </div>

              {/* Fecha inicio */}
              <div className="flex flex-col gap-1">
                <label className="text-sm text-[#212121]">Fecha Inicio</label>
                <CalendarioFecha date={fechaInicio} onDateChange={setFechaInicio} />
              </div>

              {/* Fecha fin */}
              <div className="flex flex-col gap-1">
                <label className="text-sm text-[#212121]">Fecha Fin</label>
                <CalendarioFecha date={fechaFin} onDateChange={setFechaFin} />
              </div>
            </div>

            {/* Botón enviar */}
            <button
              onClick={handleEnviar}
              className="btn-secundary px-6 py-2 text-white rounded shadow"
            >
              Enviar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
