import { useEffect, useState, useRef } from 'react';
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
  
  const [mainTab, setMainTab] = useState<'pendientes' | 'completadas'>('pendientes');
  const [subTab, setSubTab] = useState<string>('todas');

  const [posponer, setPosponer] = useState<Task | null>(null);
  const [descartar, setDescartar] = useState<Task | null>(null);
  
  const [completarTask, setCompletarTask] = useState<Task | null>(null);
  const [quienCompleto, setQuienCompleto] = useState('');
  const [comentario, setComentario] = useState('');

  const alertedTasks = useRef(new Set<string>());

  async function load() {
    if (!profile) return;
    const { data } = await supabase.from('tasks').select('*')
      .eq('tienda', profile.tienda!)
      .order('prioridad', { ascending: false }) 
      .order('fecha_limite', { ascending: true });
    setTasks(data ?? []);

    const { data: emp } = await supabase.from('empleados').select('*');
    setEmpleados(emp ?? []);
  }

  useEffect(() => { load(); }, [profile]);

  // REALTIME Y AUTO-REFRESCO
  useEffect(() => {
    if (!profile) return;
    const channel = supabase.channel('tasks-emp')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, load)
      .subscribe();
    const interval = setInterval(load, 30000);
    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, [profile]);

  // SONIDO ALERTA (10, 5, 2 min) - SONIDO MAS FUERTE
  useEffect(() => {
    const checkDeadlines = () => {
      const now = new Date().getTime();
      tasks.forEach(task => {
        if (task.estado === 'pendiente') {
          const deadline = new Date(task.fecha_limite).getTime();
          const diffMs = deadline - now;
          const diffMins = diffMs / 60000;

          if (diffMins > 0) {
            let alertKey = null;
            if (diffMins <= 2) alertKey = `${task.id}-2`;
            else if (diffMins <= 5) alertKey = `${task.id}-5`;
            else if (diffMins <= 10) alertKey = `${task.id}-10`;

            if (alertKey && !alertedTasks.current.has(alertKey)) {
              alertedTasks.current.add(alertKey);
              const audio = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
              audio.volume = 1.0;
              audio.play().catch(e => console.log('Audio bloqueado', e));
            }
          }
        }
      });
    };
    const interval = setInterval(checkDeadlines, 15000);
    return () => clearInterval(interval);
  }, [tasks]);

  function handleCompletarClick(task: Task) {
    setCompletarTask(task);
    setQuienCompleto('');
    setComentario('');
  }

  async function confirmarCompletada() {
    if (!completarTask || !quienCompleto) return;
    await supabase.from('tasks').update({
      estado: 'completada',
      completada_por: profile?.id,
      completada_por_nombre: quienCompleto,
      comentario_completado: comentario || null,
      completada_en: new Date().toISOString(),
    }).eq('id', completarTask.id);
    
    setCompletarTask(null);
    load();
  }

  const filteredTasks = tasks.filter(t => {
    if (mainTab === 'pendientes') {
      if (t.estado !== 'pendiente' && t.estado !== 'vencida') return false;
      if (subTab === 'normales') return t.prioridad === 'normal';
      if (subTab === 'urgentes') return t.prioridad === 'urgente';
      return true;
    } else {
      if (t.estado === 'pendiente') return false;
      if (subTab === 'exitosas') return t.estado === 'completada';
      if (subTab === 'vencidas') return t.estado === 'vencida';
      if (subTab === 'anuladas') return t.estado === 'descartada';
      return true;
    }
  });

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex border-b border-gray-300">
          <button onClick={() => { setMainTab('pendientes'); setSubTab('todas'); }}
            className={`px-4 py-2 font-bold ${mainTab === 'pendientes' ? 'border-b-2 border-black text-black' : 'text-gray-400'}`}>
            Pendientes
          </button>
          <button onClick={() => { setMainTab('completadas'); setSubTab('todas'); }}
            className={`px-4 py-2 font-bold ${mainTab === 'completadas' ? 'border-b-2 border-black text-black' : 'text-gray-400'}`}>
            Completadas
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {mainTab === 'pendientes' ? (
            <>
              <button onClick={() => setSubTab('todas')} className={`px-3 py-1 text-xs rounded-full border ${subTab === 'todas' ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}>Todas</button>
              <button onClick={() => setSubTab('normales')} className={`px-3 py-1 text-xs rounded-full border ${subTab === 'normales' ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}>⚫ Normales</button>
              <button onClick={() => setSubTab('urgentes')} className={`px-3 py-1 text-xs rounded-full border ${subTab === 'urgentes' ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-700'}`}>🔴 Urgentes</button>
            </>
          ) : (
            <>
              <button onClick={() => setSubTab('todas')} className={`px-3 py-1 text-xs rounded-full border ${subTab === 'todas' ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}>Todas</button>
              <button onClick={() => setSubTab('exitosas')} className={`px-3 py-1 text-xs rounded-full border ${subTab === 'exitosas' ? 'bg-green-600 text-white' : 'bg-green-50'}`}>✅ Exitosas</button>
              <button onClick={() => setSubTab('vencidas')} className={`px-3 py-1 text-xs rounded-full border ${subTab === 'vencidas' ? 'bg-orange-600 text-white' : 'bg-orange-50'}`}>⏰ Vencidas</button>
              <button onClick={() => setSubTab('anuladas')} className={`px-3 py-1 text-xs rounded-full border ${subTab === 'anuladas' ? 'bg-gray-600 text-white' : 'bg-gray-100'}`}>🚫 Anuladas</button>
            </>
          )}
        </div>

        <div className="grid gap-3">
          {filteredTasks.map(t => (
            <TaskCard key={t.id} task={t} currentUserId={profile?.id ?? ''}
              onCompletar={handleCompletarClick} onPosponer={setPosponer} onDescartar={setDescartar} />
          ))}
          {filteredTasks.length === 0 && <p className="text-center text-gray-400 py-8">No hay tareas aquí.</p>}
        </div>
      </div>

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
              <textarea value={comentario} onChange={e => setComentario(e.target.value)} maxLength={500}
                placeholder="Ej: Faltaba stock. / Se hizo rápido."
                className="w-full border border-gray-300 rounded-lg p-3 h-24 text-sm" />
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
