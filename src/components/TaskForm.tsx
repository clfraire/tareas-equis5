import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { addHours, setHours, setMinutes, format } from 'date-fns';
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
    if (!form.fecha_limite) {
      setError('Por favor, seleccioná una fecha y hora límite.');
      return;
    }
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

  // Función para los botones rápidos de fecha
  const setQuickDate = (type: '1h' | '2h' | '12:30' | '20:00') => {
    const now = new Date();
    let targetDate = now;
    
    if (type === '1h') targetDate = addHours(now, 1);
    if (type === '2h') targetDate = addHours(now, 2);
    if (type === '12:30') targetDate = setMinutes(setHours(now, 12), 30);
    if (type === '20:00') targetDate = setMinutes(setHours(now, 20), 0);
    
    // Formateamos para que el input datetime-local lo entienda
    const formatted = format(targetDate, "yyyy-MM-dd'T'HH:mm");
    setForm({ ...form, fecha_limite: formatted });
  };

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
          <option value="web">Tienda Web</option>
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
          <option value="hora">Tarea Específica</option>
          <option value="dia">Tarea Diaria</option>
          <option value="semana">Tarea Semanal</option>
        </select>
      </div>

      {/* Botones rápidos de fecha */}
      <div className="pt-2">
        <p className="text-xs text-gray-500 mb-2">Rapidez de vencimiento:</p>
        <div className="flex flex-wrap gap-2 mb-3">
          <button type="button" onClick={() => setQuickDate('1h')} className="text-xs bg-gray-100 hover:bg-gray-200 text-black px-3 py-1.5 rounded-lg border border-gray-300">En 1 hora</button>
          <button type="button" onClick={() => setQuickDate('2h')} className="text-xs bg-gray-100 hover:bg-gray-200 text-black px-3 py-1.5 rounded-lg border border-gray-300">En 2 horas</button>
          <button type="button" onClick={() => setQuickDate('12:30')} className="text-xs bg-gray-100 hover:bg-gray-200 text-black px-3 py-1.5 rounded-lg border border-gray-300">Hoy 12:30 hs</button>
          <button type="button" onClick={() => setQuickDate('20:00')} className="text-xs bg-gray-100 hover:bg-gray-200 text-black px-3 py-1.5 rounded-lg border border-gray-300">Hoy 20:00 hs</button>
        </div>
        
        <input required type="datetime-local" value={form.fecha_limite}
          onChange={e => setForm({ ...form, fecha_limite: e.target.value })}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm" />
      </div>

      <input type="number" min={1} placeholder="Tiempo estimado (min)" value={form.tiempo_estimado}
        onChange={e => setForm({ ...form, tiempo_estimado: Number(e.target.value) })}
        className="w-full border border-gray-300 rounded-lg p-3" />

      <button disabled={saving}
        className="w-full bg-black text-white rounded-lg p-3 font-semibold hover:bg-gray-800 disabled:opacity-50 mt-2">
        {saving ? 'Guardando…' : 'Crear tarea'}
      </button>
    </form>
  );
}
