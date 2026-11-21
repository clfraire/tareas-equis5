import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Task } from '../lib/types';
import Layout from '../components/Layout';
import TaskForm from '../components/TaskForm';
import TaskCard from '../components/TaskCard';
import PosponerModal from '../components/PosponerModal';
import DescartarModal from '../components/DescartarModal';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tienda, setTienda] = useState<'mujer' | 'hombre'>('mujer');
  const [estado, setEstado] = useState<'todas' | 'pendiente' | 'completada' | 'vencida' | 'descartada'>('todas');
  const [posponer, setPosponer] = useState<Task | null>(null);
  const [descartar, setDescartar] = useState<Task | null>(null);

  async function load() {
    let q = supabase.from('tasks').select('*').eq('tienda', tienda);
    if (estado !== 'todas') q = q.eq('estado', estado);
    const { data } = await q.order('fecha_limite', { ascending: true });
    setTasks(data ?? []);
  }

  useEffect(() => { load(); }, [tienda, estado]);

  useEffect(() => {
    const channel = supabase.channel('tasks-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tienda, estado]);

  // RELOJ AUTOMÁTICO: Revisa cada 60 segundos si hay tareas vencidas
  useEffect(() => {
    const interval = setInterval(async () => {
      await supabase.rpc('marcar_tareas_vencidas');
      load();
    }, 60000);
    return () => clearInterval(interval);
  }, [tienda, estado]);

  async function completar(task: Task) {
    await supabase.from('tasks').update({
      estado: 'completada', completada_por: profile?.id,
      completada_en: new Date().toISOString(),
    }).eq('id', task.id);
    load();
  }

  return (
    <Layout>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TaskForm onCreated={load} />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setTienda('mujer')}
              className={`px-3 py-1.5 rounded-lg text-sm border ${tienda === 'mujer' ? 'bg-black text-white' : 'bg-white border-gray-300'}`}>
              Tienda Mujer
            </button>
            <button onClick={() => setTienda('hombre')}
              className={`px-3 py-1.5 rounded-lg text-sm border ${tienda === 'hombre' ? 'bg-black text-white' : 'bg-white border-gray-300'}`}>
              Tienda Hombre
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['todas','pendiente','completada','vencida','descartada'] as const).map(e => (
              <button key={e} onClick={() => setEstado(e)}
                className={`px-3 py-1 rounded-lg text-xs border capitalize ${estado === e ? 'bg-gray-800 text-white' : 'bg-white border-gray-300'}`}>
                {e}
              </button>
            ))}
          </div>
          <div className="grid gap-3">
            {tasks.map(t => (
              <TaskCard key={t.id} task={t} currentUserId={profile?.id ?? ''}
                onCompletar={completar} onPosponer={setPosponer} onDescartar={setDescartar} />
            ))}
            {tasks.length === 0 && <p className="text-center text-gray-400 py-8">Sin tareas.</p>}
          </div>
        </div>
      </div>

      {posponer && (
        <PosponerModal task={posponer} onClose={() => setPosponer(null)}
          onConfirm={async (nueva) => {
            await supabase.from('tasks').update({ estado: 'pendiente', fecha_limite: nueva }).eq('id', posponer.id);
            setPosponer(null); load();
          }} />
      )}
      {descartar && (
        <DescartarModal task={descartar} onClose={() => setDescartar(null)}
          onConfirm={async (motivo) => {
            await supabase.from('tasks').update({ estado: 'descartada', motivo_descarte: motivo }).eq('id', descartar.id);
            setDescartar(null); load();
          }} />
      )}
    </Layout>
  );
}
