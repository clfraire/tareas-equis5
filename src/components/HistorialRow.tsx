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

export default function HistorialRow({ task, profilesMap }: { task: Task; profilesMap: Record<string, string>; }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<any[] | null>(null);

  async function toggle() {
    setOpen(!open);
    if (!open && history === null) {
      const { data } = await supabase.from('task_history').select('*').eq('task_id', task.id).order('created_at', { ascending: true });
      setHistory(data ?? []);
    }
  }

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={toggle} className="w-full text-left px-4 py-3 hover:bg-gray-50 transition">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
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
              👤 {task.asignado_a ? (profilesMap[task.asignado_a] ?? 'empleado') : 'Cualquiera'}
              {' · '}📅 vence {format(new Date(task.fecha_limite), "PPp", { locale: es })}
            </p>
            {task.estado === 'completada' && task.completada_por && (
              <p className="text-xs text-green-700 mt-0.5">✅ por {profilesMap[task.completada_por] ?? 'empleado'}</p>
            )}
            {task.estado === 'descartada' && task.motivo_descarte && (
              <p className="text-xs text-gray-600 mt-0.5">🚫 Motivo: {task.motivo_descarte}</p>
            )}
          </div>
          <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </button>

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
