import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Empleado, Tienda, Prioridad, Frecuencia } from '../lib/types';

export default function TaskForm({ onCreated }: { onCreated: () => void }) {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [form, setForm] = useState({
    titulo: '', descripcion: '', tienda: 'mujer' as Tienda,
    asignado_nombre: '', prioridad: 'normal' as Prioridad,
    frecuencia: 'dia' as Frecuencia,
    fecha_limite: '', tiempo_estimado: 30,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Trae a TODAS las empleadas sin importar la tienda
    supabase.from('empleados').select('*').then(({ data }) => setEmpleados(data ?? []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    
    // Si es web, no guardamos nombre de asignada
    const nombreAsignada = form.tienda === 'web' ? null : (form.asignado_nombre || null);

    const { error } = await supabase.from('tasks').insert({
      titulo: form.titulo,
      descripcion: form.descripcion || null,
      tienda: form.tienda,
      asignado_nombre: nombreAsignada,
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
          onChange={e => setForm({ ...form, tienda: e.target.value as Tienda, asignado_nombre: '' })}
          className="border border-gray-300 rounded-lg p-3">
          <option value="mujer">Tienda Mujer</option>
          <option value="hombre">Tienda Hombre</option>
          <option value="web">Página Web</option>
        </select>

        {/* Si es WEB, mostramos un texto fijo. Si no, el desplegable con TODAS las chicas */}
        {form.tienda === 'web' ? (
          <div className="border border-gray-200 bg-gray-50 rounded-lg p-3 text-sm text-gray-500 flex items-center">
            👥 Cualquiera (Web)
          </div>
        ) : (
          <select value={form.asignado_nombre}
            onChange={e => setForm({ ...form, asignado_nombre: e.target.value })}
            className="border border-gray-300 rounded-lg p-3">
            <option value="">👥 Cualquiera</option>
            {empleados.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
          </select>
        )}

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
