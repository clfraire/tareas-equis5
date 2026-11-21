import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import type { Task } from '../lib/types';

const ESTADO_BADGE: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  completada: 'bg-green-100 text-green-800',
  vencida: 'bg-red-100 text-red-800',
  descartada: 'bg-gray-200 text-gray-700',
};

const PRIORIDAD_BADGE: Record<string, string> = {
  urgente: 'bg-red-600 text-white',
  normal: 'bg-black text-white',
};

export default function HistorialRow({ task, onDelete }: { task: Task; onDelete: (id: string) => void; }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<any[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function toggle() {
    setOpen(!open);
    if (!open && history === null) {
      const { data } = await supabase.from('task_history').select('*').eq('task_id', task.id).order('created_at', { ascending: true });
      setHistory(data ?? []);
    }
  }

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="w-full px-4 py-3 hover:bg-gray-50 transition">
        <div className="flex items-start justify-between gap-3">
          
          <button onClick={toggle} className="min-w-0 flex-1 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORIDAD_BADGE[task.prioridad]}`}>
                {task.prioridad === 'urgente' ? '🔴 Urgente' : '⚫ Normal'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${ESTADO_BADGE[task.estado]}`}>
                {task.estado}
              </span>
              <span className="text-xs text-gray-500">· {task.tienda}</span>
            </div>
            <p className="font-semibold text-sm mt-1 truncate">{task.titulo}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              👤 {task.asignado_nombre ? task.asignado_nombre : 'Cualquiera'}
              {' · '}📅 vence {format(new Date(task.fecha_limite), "PPp", { locale: es })}
            </p>
            {task.estado === 'completada' && task.completada_por_nombre && (
              <p className="text-xs text-green-700 mt-0.5">✅ por {task.completada_por_nombre}</p>
            )}
            {task.estado === 'descartada' && task.motivo_descarte && (
              <p className="text-xs text-gray-600 mt-0.5">🚫 Motivo: {task.motivo_descarte}</p>
            )}
          </button>

          <div className="flex items-center gap-3">
            {confirmDelete ? (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
                <span className="text-xs text-red-700 font-bold">¿Borrar?</span>
                <button onClick={() => onDelete(task.id)} className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">Sí</button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 hover:text-black">No</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="text-gray-400 hover:text-red-600 text-lg transition-colors" title="Eliminar del historial">
                🗑️
              </button>
            )}
            
            <button onClick={toggle} className="text-gray-400 text-sm p-1">
              {open ? '▲' : '▼'}
            </button>
          </div>

        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 bg-gray-50/60">
          <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Línea de tiempo</p>
          {history === null && <p className="text-xs text-gray-400">Cargando...</p>}
          {history && history.length === 0 && <p className="text-xs text-gray-400">Sin eventos registrados.</p>}
          <ol className="space-y-2">
            {history?.map(h => (
              <li key={h.id} className="flex gap-3 text-xs">
                <span className="text-gray-400 whitespace-nowrap w-32 shrink-0">{format(new Date(h.created_at), "PPp", { locale: es })}</span>
                <span className="text-gray-700"><b className="capitalize">{h.accion}</b> {h.detalle && `· ${h.detalle}`}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
