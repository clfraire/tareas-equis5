import { useState } from 'react';
import type { Profile, Tienda, Estado, Prioridad, Frecuencia } from '../lib/types';

export interface Filtros {
  tienda: 'todas' | Tienda;
  empleado: 'todos' | 'cualquiera' | string;
  estado: 'todas' | Estado;
  prioridad: 'todas' | Prioridad;
  frecuencia: 'todas' | Frecuencia;
  desde: string;
  hasta: string;
  q: string;
}

export default function HistorialFilters({
  filtros, setFiltros, empleados, onReset,
}: {
  filtros: Filtros;
  setFiltros: (f: Filtros) => void;
  empleados: Profile[];
  onReset: () => void;
}) {
  const [open, setOpen] = useState(true);
  const set = (k: keyof Filtros, v: any) => setFiltros({ ...filtros, [k]: v });

  const activos = Object.entries(filtros).filter(([k, v]) => {
    if (k === 'tienda' || k === 'estado' || k === 'prioridad' || k === 'frecuencia') return v !== 'todas';
    if (k === 'empleado') return v !== 'todos';
    return Boolean(v);
  }).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold">
        <span>🔍 Filtros {activos > 0 && <span className="ml-1 bg-black text-white text-xs rounded-full px-2">{activos}</span>}</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="block">
              <span className="text-xs text-gray-500 mb-1 block">Tienda</span>
              <select value={filtros.tienda} onChange={e => set('tienda', e.target.value)} className="input w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="todas">Todas</option>
                <option value="mujer">Mujer</option>
                <option value="hombre">Hombre</option>
                <option value="web">Web</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-gray-500 mb-1 block">Asignada A:</span>
              <select value={filtros.empleado} onChange={e => set('empleado', e.target.value)} className="input w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="todos">Todos</option>
                <option value="cualquiera">Cualquiera</option>
                {/* Acá mostramos SIEMPRE a todos los empleados, sin importar la tienda elegida arriba */}
                {empleados.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-gray-500 mb-1 block">Estado</span>
              <select value={filtros.estado} onChange={e => set('estado', e.target.value)} className="input w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="todas">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="completada">Completada</option>
                <option value="vencida">Vencida</option>
                <option value="descartada">Descartada</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-gray-500 mb-1 block">Prioridad</span>
              <select value={filtros.prioridad} onChange={e => set('prioridad', e.target.value)} className="input w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="todas">Todas</option>
                <option value="urgente">🔴 Urgente</option>
                <option value="normal">⚫ Normal</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-gray-500 mb-1 block">Vence desde</span>
              <input type="date" value={filtros.desde} onChange={e => set('desde', e.target.value)} className="input w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" />
            </label>

            <label className="block">
              <span className="text-xs text-gray-500 mb-1 block">Vence hasta</span>
              <input type="date" value={filtros.hasta} onChange={e => set('hasta', e.target.value)} className="input w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" />
            </label>

            <label className="block col-span-2">
              <span className="text-xs text-gray-500 mb-1 block">Buscar (título)</span>
              <input type="text" placeholder="Ej: reposición" value={filtros.q} onChange={e => set('q', e.target.value)} className="input w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" />
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={onReset} className="text-xs text-gray-500 hover:text-black underline">
              Limpiar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
