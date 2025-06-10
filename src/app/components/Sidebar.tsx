// src/components/Sidebar.tsx

/*
'use client'

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Sidebar() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen p-4">
      <nav className="flex flex-col h-full justify-between">
        <div>
          <button
            onClick={() => router.push('/dashboard')}
            className="block mb-4 text-lg font-medium text-gray-800 hover:text-red-700"
          >
            Dashboard
          </button>
          

        
        </div>
        <button
          onClick={handleLogout}
          className="text-red-600 hover:underline"
        >
          Cerrar sesión
        </button>
      </nav>
    </aside>
  );
}


*/