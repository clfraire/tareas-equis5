import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Task } from '../lib/types';

interface Props {
  task: Task;
  currentUserId: string;
  onCompletar: (task: Task) => void;
  onPosponer: (task: Task) => void;
  onDescartar: (task: Task) => void;
}

const ESTADO_BADGE: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  completada: 'bg-green-600 text-white',
  vencida: 'bg-red-600 text-white',
  descartada: 'bg-gray-300 text-gray-800',
};

export default function TaskCard({ task, currentUserId, onCompletar, onPosponer, onDescartar }: Props) {
  const isCompletada = task.estado === 'completada';
  const isDescartada = task.estado === 'descartada';
  
  // Magia acá: si la fecha límite ya pasó, la tratamos como vencida inmediatamente
  const isTimeUp = new Date(task.fecha_limite).getTime() < new Date().getTime();
  const isVencida = task.estado === 'vencida' || (task.estado === 'pendiente' && isTimeUp);
  
  // Para el cartelito de arriba
  const displayEstado = isVencida ? 'vencida' : task.estado;

  const colorBase = isCompletada
    ? 'border-green-500 bg-green-50'
    : isDescartada
    ? 'border-gray-300 bg-gray-100 opacity-70'
    : task.prioridad === 'urgente' || (isVencida && !isCompletada)
    ? 'border-red-500 bg-red-50'
    : 'border-gray-800 bg-white';

  const textColor = (task.prioridad === 'urgente' || isVencida) && !isCompletada && !isDescartada ? 'text-red-700' : 'text-black';
  const canAct = !isCompletada && !isDescartada;

  return (
    <div className={`rounded-xl border-l-4 border p-4 shadow-sm transition ${colorBase} ${isVencida && !isCompletada ? 'animate-pulse ring-2 ring-red-400' : ''}`}>
      <div className="flex justify-between items-start gap-2">
        <div>
          <h3 className={`font-bold ${textColor}`}>{task.titulo}</h3>
          {task.descripcion && <p className="text-sm text-gray-600 mt-1">{task.descripcion}</p>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-black/5 whitespace-nowrap font-semibold">
            {task.prioridad === 'urgente' ? '🔴 Urgente' : '⚫ Normal'}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${ESTADO_BADGE[displayEstado]}`}>
            {displayEstado}
          </span>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-600 space-y-1">
        <p>📅 Vence: {format(new Date(task.fecha_limite), "PPp", { locale: es })}</p>
        <p>🏬 Tienda: {task.tienda} · 🔁 {task.frecuencia}</p>
        <p>👤 Asignada a: <span className="font-semibold text-black">{task.asignado_nombre ? task.asignado_nombre : 'Cualquiera'}</span></p>
        
        {isCompletada && task.completada_por_nombre && (
          <p className="text-green-700 font-semibold mt-1">✅ Completada por: {task.completada_por_nombre}</p>
        )}
        {isDescartada && task.motivo_descarte && (
          <p className="text-gray-700 mt-1">🚫 Motivo: {task.motivo_descarte}</p>
        )}
      </div>

      {canAct && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => onCompletar(task)} className="text-sm bg-green-600 text-white rounded-lg px-3 py-1.5 hover:bg-green-700 font-medium shadow-sm">✅ Confirmar realizada</button>
          {isVencida && (
            <>
              <button onClick={() => onPosponer(task)} className="text-sm bg-yellow-500 text-white rounded-lg px-3 py-1.5 hover:bg-yellow-600 shadow-sm">⏰ Posponer</button>
              <button onClick={() => onDescartar(task)} className="text-sm bg-gray-700 text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 shadow-sm">🚫 Descartar</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
