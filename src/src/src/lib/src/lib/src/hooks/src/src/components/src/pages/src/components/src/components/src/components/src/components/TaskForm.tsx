import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, Tienda, Prioridad, Frecuencia } from '../lib/types';

export default function TaskForm({ onCreated }: { onCreated: () => void }) {
  const [empleados, setEmpleados] = useState<Profile[]>([]);
  const [form, setForm] = useState({
    titulo: '', descripcion: '', tienda: 'mujer' as Tienda,
    asignado_a: '', prioridad: 'normal' as Prioridad,
    frecuencia: 'dia' as Frecuencia,
    fecha_limite: '', tiempo_estimado: 30,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('*').eq('rol', 'empleado').then(({ data }) => setEmpleados(data ?? []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const { error } = await supabase.from('tasks').insert({
      titulo: form.titulo,
      descripcion: form.descripcion || null,
      tienda: form.tienda,
      asignado_a: form.asignado_a || null,
      prioridad: form.prioridad,
      frecuencia: form.frecuencia,
      fecha_limite: new Date(form.fecha_limite).toISOString(),
      tiempo_estimado: form.tiempo_estimado,
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setForm({ ...form, titulo: '', descripcion: '', fecha_limite: '' });
    onCreated();
  }

  const filtrados = empleados.filter(e => e.tienda === form.tienda);

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 space-y-3">
      <h2 className="font-bold text-lg">Nueva tarea</h2>
      {error && <div className="bg-red-50 text-red-700 text-sm p-2 rounded">{error}</div>}

      <input required placeholder="Título" value={form.titulo}
        onChange={e => setForm({ ...form, titulo: e.target.value })}
        className="w-full border border-gray-300 rounded-lg p-3" />

      <textarea placeholder="Descripción (opcional)" value={form.descripcion}
        onChange={e => setForm({ ...form, descripcion: e.target.value })}
        className="w-full border border-gray-300 rounded-lg p-3 h-20" />

      <div className="grid grid-cols-2 gap-3">
        <select value={form.tienda}
          onChange={e => setForm({ ...form, tienda: e.target.value as Tienda, asignado_a: '' })}
          className="border border-gray-300 rounded-lg p-3">
          <option value="mujer">Tienda Mujer</option>
          <option value="hombre">Tienda Hombre</option>
        </select>

        <select value={form.asignado_a}
          onChange={e => setForm({ ...form, asignado_a: e.target.value })}
          className="border border-gray-300 rounded-lg p-3">
          <option value="">👥 Cualquiera</option>
          {filtrados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>

        <select value={form.prioridad}
          onChange={e => setForm({ ...form, prioridad: e.target.value as Prioridad })}
          className="border border-gray-300 rounded-lg p-3">
          <option value="normal">⚫ Normal</option>
          <option value="urgente">🔴 Urgente</option>
        </select>

        <select value={form.frecuencia}
          onChange={e => setForm({ ...form, frecuencia: e.target.value as Frecuencia })}
          className="border border-gray-300 rounded-lg p-3">
          <option value="hora">Por hora</option>
          <option value="dia">Por día</option>
          <option value="semana">Por semana</option>
        </select>

        <input required type="datetime-local" value={form.fecha_limite}
          onChange={e => setForm({ ...form, fecha_limite: e.target.value })}
          className="border border-gray-300 rounded-lg p-3 col-span-2" />

        <input type="number" min={1} placeholder="Tiempo estimado (min)" value={form.tiempo_estimado}
          onChange={e => setForm({ ...form, tiempo_estimado: Number(e.target.value) })}
          className="border border-gray-300 rounded-lg p-3 col-span-2" />
      </div>

      <button disabled={saving}
        className="w-full bg-black text-white rounded-lg p-3 font-semibold hover:bg-gray-800 disabled:opacity-50">
        {saving ? 'Guardando…' : 'Crear tarea'}
      </button>
    </form>
  );
}
