import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Empleado, Tienda, Prioridad, Frecuencia } from '../lib/types';
import { addHours, setHours, setMinutes, format } from 'date-fns';

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
    // Tu tabla original de empleados
    supabase.from('empleados').select('*').then(({ data }) => setEmpleados(data ?? []));
  }, []);

  // Función para setear fechas rápido (Actualizada con tus botones)
  const setQuickDate = (tipo: '1h' | '2h' | '12:30' | '20:00') => {
    const now = new Date();
    let date = now;
    
    if (tipo === '1h') date = addHours(now, 1);
    if (tipo === '2h') date = addHours(now, 2);
    if (tipo === '12:30') date = setMinutes(setHours(now, 12), 30);
    if (tipo === '20:00') date = setMinutes(setHours(now, 20), 0);
    
    setForm({ ...form, fecha_limite: format(date, "yyyy-MM-dd'T'HH:mm") });
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    
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

      <input required placeholder="Título de la tarea" value={form.titulo}
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
          className="border border-gray-300 rounded-lg p-3 col-span-2 font-medium">
          <option value="normal">⚫ Prioridad Normal</option>
          <option value="urgente">🔴 Prioridad URGENTE</option>
        </select>

        <select value={form.frecuencia}
          onChange={e => setForm({ ...form, frecuencia: e.target.value as Frecuencia })}
          className="border border-gray-300 rounded-lg p-3 col-span-2">
          <option value="hora">Tarea Específica (Por Hora)</option>
          <option value="dia">Tarea Diaria</option>
          <option value="semana">Tarea Semanal</option>
        </select>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
        <label className="block text-sm font-medium text-gray-700">Fecha y hora límite:</label>
        <input required type="datetime-local" value={form.fecha_limite}
          onChange={e => setForm({ ...form, fecha_limite: e.target.value })}
          className="w-full border border-gray-300 rounded-lg p-3 bg-white" />
        
        <div className="flex flex-wrap gap-1 mt-1">
          <button type="button" onClick={() => setQuickDate('1h')} className="text-xs bg-white border border-gray-300 rounded px-2 py-1 hover:bg-gray-100">+1 Hora</button>
          <button type="button" onClick={() => setQuickDate('2h')} className="text-xs bg-white border border-gray-300 rounded px-2 py-1 hover:bg-gray-100">+2 Horas</button>
          <button type="button" onClick={() => setQuickDate('12:30')} className="text-xs bg-white border border-gray-300 rounded px-2 py-1 hover:bg-gray-100">Hoy 12:30 hs</button>
          <button type="button" onClick={() => setQuickDate('20:00')} className="text-xs bg-white border border-gray-300 rounded px-2 py-1 hover:bg-gray-100">Hoy 20:00 hs</button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo estimado de realización:</label>
        <select value={form.tiempo_estimado}
          onChange={e => setForm({ ...form, tiempo_estimado: Number(e.target.value) })}
          className="w-full border border-gray-300 rounded-lg p-3">
          <option value={15}>15 minutos</option>
          <option value={30}>30 minutos</option>
          <option value={45}>45 minutos</option>
          <option value={60}>1 hora</option>
          <option value={120}>2 horas</option>
          <option value={180}>3 horas</option>
        </select>
      </div>

      <button disabled={saving}
        className="w-full bg-black text-white rounded-lg p-3 font-semibold hover:bg-gray-800 disabled:opacity-50 mt-2">
        {saving ? 'Guardando…' : 'Crear tarea'}
      </button>
    </form>
  );
}
