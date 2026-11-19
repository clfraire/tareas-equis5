import { useState } from 'react';
import type { Task } from '../lib/types';

export default function DescartarModal({ task, onClose, onConfirm }: {
  task: Task;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void>;
}) {
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold">🚫 Descartar tarea</h2>
        <p className="text-sm text-gray-600">{task.titulo}</p>
        <textarea required value={motivo} onChange={e => setMotivo(e.target.value)}
          placeholder="Motivo del descarte (obligatorio)"
          className="w-full border border-gray-300 rounded-lg p-3 h-24" />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancelar</button>
          <button
            disabled={motivo.trim().length < 3 || saving}
            onClick={async () => { setSaving(true); await onConfirm(motivo); setSaving(false); }}
            className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-white disabled:opacity-50 hover:bg-gray-900">
            {saving ? 'Guardando…' : 'Descartar'}
          </button>
        </div>
      </div>
    </div>
  );
}
