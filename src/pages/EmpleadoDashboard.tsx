import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Task, Empleado } from '../lib/types';
import Layout from '../components/Layout';
import TaskCard from '../components/TaskCard';
import PosponerModal from '../components/PosponerModal';
import DescartarModal from '../components/DescartarModal';

export default function EmpleadoDashboard() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [frecuencia, setFrecuencia] = useState<'todas' | 'hora' | 'dia' | 'semana'>('todas');
  
  const [posponer, setPosponer] = useState<Task | null>(null);
  const [descartar, setDescartar] = useState<Task | null>(null);
  
  // Estado para el modal de completar
  const [completarTask, setCompletarTask] = useState<Task | null>(null);
  const [quienCompleto, setQuienCompleto] = useState('');
  const [comentario, setComentario] = useState(''); // <-- NUEVO

  async function load() {
    if (!profile) return;
    let q = supabase.from('tasks').select('*').eq('tienda', profile.tienda!);
    if (frecuencia !== 'todas') q = q.eq('frecuencia', frecuencia);
    
    // ORDENAMIENTO: Primero Urgentes (descendente), luego por fecha (más próxima primero)
    const { data } = await q
      .order('prioridad', { ascending: false }) 
      .order('fecha_limite', { ascending: true });
      
    setTasks(data ?? []);

    const { data: emp } = await supabase.from('empleados').select('*').eq('tienda', profile.tienda!);
    setEmpleados(emp ?? []);
  }

  useEffect(() => { load(); }, [profile, frecuencia]);

  useEffect(() => {
    if (!profile) return;
    const channel = supabase.channel('tasks-emp')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile, frecuencia]);

  function handleCompletarClick(task: Task) {
    setCompletarTask(task);
    setQuienCompleto('');
    setComentario(''); // Limpiamos el comentario
  }

  async function confirmarCompletada() {
    if (!completarTask || !quienCompleto) return;
    await supabase.from('tasks').update({
      estado: 'completada',
      completada_por: profile?.id,
      completada_por_nombre: quienCompleto,
      comentario_completado: comentario || null, // <-- Guardamos el comentario
      completada_en: new Date().toISOString(),
    }).eq('id', completarTask.id);
    
    setCompletarTask(null);
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
            onCompletar={handleCompletarClick} onPosponer={setPosponer} onDescartar={setDescartar} />
        ))}
        {tasks.length === 0 && <p className="text-center text-gray-400 py-8">No hay tareas asignadas.</p>}
      </div>

      {/* MODAL PARA PREGUNTAR QUIÉN COMPLETÓ LA TAREA */}
      {completarTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold">✅ Confirmar tarea</h2>
            <p className="text-sm text-gray-600 font-medium">{completarTask.titulo}</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">¿Quién realizó esta tarea?</label>
              <select value={quienCompleto} onChange={e => setQuienCompleto(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3">
                <option value="">Seleccioná tu nombre...</option>
                {empleados.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comentario (opcional)</label>
              <textarea 
                value={comentario} 
                onChange={e => setComentario(e.target.value)}
                maxLength={500}
                placeholder="Ej: Faltaba stock, se avisó a Cintia. / Se hizo rápido."
                className="w-full border border-gray-300 rounded-lg p-3 h-24 text-sm" 
              />
              <p className="text-xs text-gray-400 text-right mt-1">{comentario.length}/500 caracteres (aprox. 100 palabras)</p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setCompletarTask(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancelar</button>
              <button disabled={!quienCompleto} onClick={confirmarCompletada} className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white disabled:opacity-50 hover:bg-green-700">Confirmar</button>
            </div>
          </div>
        </div>
      )}

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
