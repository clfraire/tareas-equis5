import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Task } from '../lib/types';
import Layout from '../components/Layout';
import TaskCard from '../components/TaskCard';
import PosponerModal from '../components/PosponerModal';
import DescartarModal from '../components/DescartarModal';

export default function EmpleadoDashboard() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [frecuencia, setFrecuencia] = useState<'todas' | 'hora' | 'dia' | 'semana'>('todas');
  const [posponer, setPosponer] = useState<Task | null>(null);
  const [descartar, setDescartar] = useState<Task | null>(null);

  async function load() {
    if (!profile) return;
    let q = supabase.from('tasks').select('*').eq('tienda', profile.tienda!);
    if (frecuencia !== 'todas') q = q.eq('frecuencia', frecuencia);
    const { data } = await q.order('fecha_limite', { ascending: true });
    setTasks((data ?? []).filter(t => t.asignado_a === null || t.asignado_a === profile.id));
  }

  useEffect(() => { load(); }, [profile, frecuencia]);

  useEffect(() => {
    if (!profile) return;
    const channel = supabase.channel('tasks-emp')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile, frecuencia]);

    useEffect(() => {
    const interval = setInterval(async () => {
      await supabase.rpc('marcar_tareas_vencidas');
      load();
    }, 60000);
    return () => clearInterval(interval);
  }, [profile, frecuencia]);
  // RELOJ AUTOMÁTICO: Revisa cada 60 segundos si hay tareas vencidas
  useEffect(() => {
    const interval = setInterval(async () => {
      await supabase.rpc('marcar_tareas_vencidas');
      load();
    }, 60000);
    return () => clearInterval(interval);
  }, [profile, frecuencia]);

  async function completar(task: Task) {
    await supabase.from('tasks').update({
      estado: 'completada', completada_por: profile?.id,
      completada_en: new Date().toISOString(),
    }).eq('id', task.id);
    load();
  }

  return (
    <Layout>
      <div className="flex flex-wrap gap-2 mb-4">
        {(['todas','hora','dia','semana'] as const).map(f => (
          <button key={f} onClick={() => setFrecuencia(f)}
            className={`px-3 py-1.5 rounded-lg text-sm border capitalize ${frecuencia === f ? 'bg-black text-white' : 'bg-white border-gray-300'}`}>
            {f}
          </button>
        ))}
      </div>
      <div className="grid gap-3">
        {tasks.map(t => (
          <TaskCard key={t.id} task={t} currentUserId={profile?.id ?? ''}
            onCompletar={completar} onPosponer={setPosponer} onDescartar={setDescartar} />
        ))}
        {tasks.length === 0 && <p className="text-center text-gray-400 py-8">No hay tareas asignadas.</p>}
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
