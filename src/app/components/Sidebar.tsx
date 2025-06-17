'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';

interface SidebarProps {
  user: { email: string };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const items = [
    { href: '/registro-horas', icon: '/Resultados-b.svg', label: 'Registro de horas' },
    { href: '/dias-libres', icon: '/Schedule-b.svg', label: 'Registro de días libres' },
  ];

  // Implementación básica de cerrar sesión
  const handleLogout = () => {
    // Aquí puedes limpiar el almacenamiento local, cookies, etc.
    // Por ejemplo:
    // localStorage.removeItem('token');
    // Redirige al login
    router.push('/login');
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-[#802528] text-white flex flex-col justify-between p-4 z-50">
      <div>
        <div className="flex justify-center mb-8">
          <img src="/Logo_CyD_blanco.svg" alt="CyD Ingeniería" className="h-14" />
        </div>
        <nav className="space-y-4">
          {items.map(({ href, icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 p-3 rounded w-full text-left transition-colors ${
                  active ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <img src={icon} alt={label} className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="footer">
        <p>{user.email}</p> {/* Muestra el correo del usuario */}
        <button
          className="flex items-center gap-3 p-3 hover:bg-white/5 rounded w-full text-left"
          onClick={handleLogout}
        >
          <img src="/exit-b.svg" alt="Cerrar sesión" className="w-5 h-5" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
