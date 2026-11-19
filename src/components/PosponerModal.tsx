import { useState } from 'react';
import type { Task } from '../lib/types';

export default function PosponerModal({ task, onClose, onConfirm }: {
  task: Task;
  onClose: () => void;
  onConfirm: (nuevaFecha: string) => Promise<void>;
}) {
  const [fecha, setFecha] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold">⏰ Posponer tarea</h2>
        <p className="text-sm text-gray-600">{task.titulo}</p>
        <input type="datetime-local" value={fecha} onChange={e => setFecha(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3" />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancelar</button>
          <button
            disabled={!fecha || saving}
            onClick={async () => { setSaving(true); await onConfirm(new Date(fecha).toISOString()); setSaving(false); }}
            className="px-4 py-2 text-sm rounded-lg bg-yellow-500 text-white disabled:opacity-50 hover:bg-yellow-600">
            {saving ? 'Guardando…' : 'Posponer'}
          </button>
        </div>
      </div>
    </div>
  );
}
