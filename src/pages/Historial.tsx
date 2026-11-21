import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, Task } from '../lib/types';
import Layout from '../components/Layout';
import HistorialFilters, { type Filtros } from '../components/HistorialFilters';
import HistorialRow from '../components/HistorialRow';

const PAGE_SIZE = 30;

export default function Historial() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [empleados, setEmpleados] = useState<Profile[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const [filtros, setFiltros] = useState<Filtros>({
    tienda: 'todas', empleado: 'todos', estado: 'todas',
    prioridad: 'todas', frecuencia: 'todas', desde: '', hasta: '', q: '',
  });

  // Corrección: Trae absolutamente a todos los usuarios (menos tu admin principal)
  useEffect(() => {
    supabase.from('profiles').select('*').then(({ data }) => {
      const arr = data ?? [];
      setEmpleados(arr.filter(p => p.email !== 'admin@equis5.com'));
      const map: Record<string, string> = {};
      arr.forEach(p => (map[p.id] = p.nombre));
      setProfilesMap(map);
    });
  }, []);

  useEffect(() => { setPage(0); }, [filtros]);

  const buildQuery = (selectOpts: any = {}) => {
    let q = supabase.from('tasks').select('*', selectOpts);
    if (filtros.tienda !== 'todas') q = q.eq('tienda', filtros.tienda);
    if (filtros.estado !== 'todas') q = q.eq('estado', filtros.estado);
    if (filtros.prioridad !== 'todas') q = q.eq('prioridad', filtros.prioridad);
    if (filtros.empleado === 'cualquiera') q = q.is('asignado_a', null);
    else if (filtros.empleado !== 'todos') q = q.eq('asignado_a', filtros.empleado);
    if (filtros.desde) q = q.gte('fecha_limite', new Date(filtros.desde).toISOString());
    if (filtros.hasta) q = q.lte('fecha_limite', new Date(filtros.hasta + 'T23:59:59').toISOString());
    if (filtros.q.trim()) q = q.ilike('titulo', `%${filtros.q.trim()}%`);
    return q;
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
      }
    })();
    return () => { cancelled = true; };
  }, [filtros, page]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold">📜 Historial de tareas</h1>
        </div>

        <HistorialFilters filtros={filtros} setFiltros={setFiltros} empleados={empleados}
          onReset={() => setFiltros({ tienda: 'todas', empleado: 'todos', estado: 'todas', prioridad: 'todas', frecuencia: 'todas', desde: '', hasta: '', q: '' })} 
        />

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading && <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>}
          {!loading && tasks.length === 0 && <div className="p-12 text-center text-gray-400">No hay tareas que coincidan.</div>}
          {!loading && tasks.map(t => <HistorialRow key={t.id} task={t} profilesMap={profilesMap} />)}
        </div>

        <div className="flex items-center justify-between text-sm pb-8">
          <span className="text-gray-500">{count} resultado(s) · página {page + 1} de {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Anterior</button>
            <button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Siguiente →</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
