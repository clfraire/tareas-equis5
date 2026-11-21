import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            {/* Contenedor del logo con respaldo por si falla la imagen */}
            <div className="h-14 w-14 bg-black rounded-lg flex items-center justify-center overflow-hidden shrink-0">
               <img 
                 src="/logo.png" 
                 alt="Logo" 
                 className="h-full w-full object-cover" 
                 onError={(e) => { e.currentTarget.style.display = 'none'; }} 
               />
               <span className="text-white font-bold absolute text-xl">E5</span>
            </div>

            <div className="flex flex-col">
              <h1 className="text-3xl font-black text-black tracking-tighter leading-none mb-1">
                Tareas de Equis5
              </h1>
              <p className="text-sm text-gray-500 font-medium">
                {profile?.nombre} · {profile?.rol === 'admin' ? 'Administradora' : `Tienda ${profile?.tienda}`}
              </p>
            </div>
          </div>

          <button onClick={async () => { await signOut(); nav('/login'); }}
            className="text-sm font-semibold text-gray-600 hover:text-black border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition">
            Salir
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 pb-12">{children}</main>
    </div>
  );
}
