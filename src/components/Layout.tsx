import { useAuth } from '../hooks/useAuth';
import { useNavigate, NavLink } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const nav = useNavigate();

  // Clase para resaltar el botón de la pestaña activa
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
      isActive ? 'bg-gray-100 text-black' : 'text-gray-500 hover:text-black hover:bg-gray-50'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          
          <div>
            <h1 className="text-lg font-bold">Tareas Equis5</h1>
            <p className="text-xs text-gray-500">
              {profile?.nombre} · {profile?.rol === 'admin' ? 'Administradora' : `Tienda ${profile?.tienda}`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Menú de navegación para la administradora */}
            {profile?.rol === 'admin' && (
              <nav className="flex items-center gap-1 mr-2 border-r border-gray-200 pr-2">
                <NavLink to="/" className={navClass}>
                  🏠 Inicio
                </NavLink>
                <NavLink to="/historial" className={navClass}>
                  📜 Historial
                </NavLink>
              </nav>
            )}
            {/* Botón de salir */}
            <button onClick={async () => { await signOut(); nav('/login'); }}
              className="text-sm text-gray-600 hover:text-black border border-gray-300 rounded-lg px-3 py-1.5">
              Salir
            </button>
          </div>

        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4">{children}</main>
    </div>
  );
}
