import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Empleado, Task } from '../lib/types';
import Layout from '../components/Layout';
import HistorialFilters, { type Filtros } from '../components/HistorialFilters';
import HistorialRow from '../components/HistorialRow';

const PAGE_SIZE = 30;

export default function Historial() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [filtros, setFiltros] = useState<Filtros>({
    tienda: 'todas', empleado: 'todos', estado: 'todas',
    prioridad: 'todas', frecuencia: 'todas', desde: '', hasta: '', q: '',
  });

  useEffect(() => {
    supabase.from('empleados').select('*').then(({ data }) => {
      setEmpleados(data ?? []);
    });
  }, []);

  useEffect(() => { 
    setPage(0); 
    setSelectedIds([]); // Limpiamos la selección al cambiar filtros
  }, [filtros]);

  const buildQuery = (selectOpts: any = {}) => {
    let q = supabase.from('tasks').select('*', selectOpts);
    
    if (filtros.tienda !== 'todas') q = q.eq('tienda', filtros.tienda);
    if (filtros.estado !== 'todas') q = q.eq('estado', filtros.estado);
    if (filtros.prioridad !== 'todas') q = q.eq('prioridad', filtros.prioridad);
    if (filtros.frecuencia !== 'todas') q = q.eq('frecuencia', filtros.frecuencia);
    
    if (filtros.empleado === 'cualquiera') {
      q = q.is('asignado_nombre', null);
    } else if (filtros.empleado !== 'todos') {
      q = q.eq('asignado_nombre', filtros.empleado);
    }
    
    if (filtros.desde) q = q.gte('fecha_limite', new Date(filtros.desde).toISOString());
    if (filtros.hasta) q = q.lte('fecha_limite', new Date(filtros.hasta + 'T23:59:59').toISOString());
    if (filtros.q.trim()) q = q.ilike('titulo', `%${filtros.q.trim()}%`);
    return q;
  };

  const loadData = async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count, error } = await buildQuery({ count: 'exact' })
      .order('fecha_limite', { ascending: false }).range(from, to);
    if (!error) { 
      setTasks(data ?? []); 
      setCount(count ?? 0); 
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, count, error } = await buildQuery({ count: 'exact' })
        .order('fecha_limite', { ascending: false }).range(from, to);
      if (!cancelled) {
        if (!error) { setTasks(data ?? []); setCount(count ?? 0); }
        setLoading(false);
        setSelectedIds([]); // Limpiamos selección al cambiar de página
      }
    })();
    return () => { cancelled = true; };
  }, [filtros, page]);

  // Función para eliminar una tarea individual
  async function handleDelete(id: string) {
    await supabase.from('tasks').delete().eq('id', id);
    loadData();
  }

  // Funciones para la selección múltiple
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === tasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tasks.map(t => t.id));
    }
  };

  // Función para borrar todas las seleccionadas
  const handleBulkDelete = async () => {
    const confirm = window.confirm(`¿Estás seguro que querés eliminar ${selectedIds.length} tarea(s)? Esta acción no se puede deshacer.`);
    if (!confirm) return;
    
    setLoading(true);
    await supabase.from('tasks').delete().in('id', selectedIds);
    setSelectedIds([]);
    await loadData();
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const allSelected = tasks.length > 0 && selectedIds.length === tasks.length;

  return (
    <Layout>
      <div className="space-y-4 pb-20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold">📜 Historial de tareas</h1>
        </div>

        <HistorialFilters filtros={filtros} setFiltros={setFiltros} empleados={empleados}
          onReset={() => setFiltros({ tienda: 'todas', empleado: 'todos', estado: 'todas', prioridad: 'todas', frecuencia: 'todas', desde: '', hasta: '', q: '' })} 
        />

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          
          {/* Barra de "Seleccionar Todo" */}
          {!loading && tasks.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-200">
              <input 
                type="checkbox" 
                checked={allSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-black rounded border-gray-300 focus:ring-black cursor-pointer" 
              />
              <span className="text-xs text-gray-600 font-medium cursor-pointer" onClick={toggleSelectAll}>
                Seleccionar todo (esta página)
              </span>
            </div>
          )}

          {loading && <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>}
          {!loading && tasks.length === 0 && <div className="p-12 text-center text-gray-400">No hay tareas que coincidan.</div>}
          {!loading && tasks.map(t => (
            <HistorialRow 
              key={t.id} 
              task={t} 
              onDelete={handleDelete} 
              isSelected={selectedIds.includes(t.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-sm pb-8">
          <span className="text-gray-500">{count} resultado(s) · página {page + 1} de {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Anterior</button>
            <button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Siguiente →</button>
          </div>
        </div>
      </div>

      {/* Barra flotante de eliminación múltiple */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-4 z-50 animate-in fade-in slide-in-from-bottom-4">
          <span className="text-sm font-medium whitespace-nowrap">
            {selectedIds.length} seleccionada(s)
          </span>
          <button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-2">
            🗑️ Eliminar
          </button>
          <button onClick={() => setSelectedIds([])} className="text-gray-400 hover:text-white p-1" title="Cancelar selección">
            ✕
          </button>
        </div>
      )}
    </Layout>
  );
}
