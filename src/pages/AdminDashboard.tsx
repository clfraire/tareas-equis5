import { useEffect, useState, useRef } from 'react';
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
  const [tienda, setTienda] = useState<'mujer' | 'hombre' | 'web'>('mujer');
  
  const [mainTab, setMainTab] = useState<'pendientes' | 'completadas'>('pendientes');
  const [subTab, setSubTab] = useState<string>('todas');

  const [posponer, setPosponer] = useState<Task | null>(null);
  const [descartar, setDescartar] = useState<Task | null>(null);
  
  const alertedTasks = useRef(new Set<string>());

  async function load() {
    let q = supabase.from('tasks').select('*, profiles:asignado_a(nombre,email)').eq('tienda', tienda);
    const { data } = await q.order('prioridad', { ascending: false }).order('fecha_limite', { ascending: true });
    setTasks(data ?? []);
  }

  useEffect(() => { load(); }, [tienda]);

  // REALTIME Y AUTO-REFRESCO (cada 30 seg)
  useEffect(() => {
    const channel = supabase.channel('tasks-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, load)
      .subscribe();
    const interval = setInterval(load, 30000);
    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, [tienda]);

  // SONIDO ALERTA 10 MINUTOS
  useEffect(() => {
    const checkDeadlines = () => {
      const now = new Date().getTime();
      tasks.forEach(task => {
        if (task.estado === 'pendiente') {
          const deadline = new Date(task.fecha_limite).getTime();
          const diff = deadline - now;
          // Si faltan menos de 10 min (600,000 ms) y no sonó todavía
          if (diff > 0 && diff <= 10 * 60 * 1000 && !alertedTasks.current.has(task.id)) {
            alertedTasks.current.add(task.id);
            const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
            audio.play().catch(e => console.log('Audio bloqueado por el navegador', e));
          }
        }
      });
    };
    const interval = setInterval(checkDeadlines, 30000); // Revisa cada 30 seg
    return () => clearInterval(interval);
  }, [tasks]);

  async function completar(task: Task) {
    await supabase.from('tasks').update({
      estado: 'completada', completada_por: profile?.id,
      completada_en: new Date().toISOString(),
    }).eq('id', task.id);
    load();
  }

  // FILTRADO PARA LAS PESTAÑAS
  const filteredTasks = tasks.filter(t => {
    if (mainTab === 'pendientes') {
      if (t.estado !== 'pendiente' && t.estado !== 'vencida') return false;
      if (subTab === 'normales') return t.prioridad === 'normal';
      if (subTab === 'urgentes') return t.prioridad === 'urgente' && (t.frecuencia === 'hora' || t.frecuencia === 'dia');
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
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TaskForm onCreated={load} />
        </div>
        
        <div className="lg:col-span-2 space-y-4">
          {/* Selector de Tienda */}
          <div className="flex flex-wrap gap-2">
            {(['mujer', 'hombre', 'web'] as const).map(t => (
              <button key={t} onClick={() => { setTienda(t); setMainTab('pendientes'); setSubTab('todas'); }}
                className={`px-3 py-1.5 rounded-lg text-sm border capitalize ${tienda === t ? 'bg-black text-white' : 'bg-white border-gray-300'}`}>
                {t === 'web' ? '🌐 Página Web' : `Tienda ${t}`}
              </button>
            ))}
          </div>

          {/* Pestañas Principales */}
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

          {/* Sub-Pestañas */}
          <div className="flex flex-wrap gap-2">
            {mainTab === 'pendientes' ? (
              <>
                <button onClick={() => setSubTab('todas')} className={`px-3 py-1 text-xs rounded-full border ${subTab === 'todas' ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}>Todas</button>
                <button onClick={() => setSubTab('normales')} className={`px-3 py-1 text-xs rounded-full border ${subTab === 'normales' ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}>⚫ Normales</button>
                <button onClick={() => setSubTab('urgentes')} className={`px-3 py-1 text-xs rounded-full border ${subTab === 'urgentes' ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-700'}`}>🔴 Urgentes (Hora/Día)</button>
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

          {/* Listado de Tareas */}
          <div className="grid gap-3">
            {filteredTasks.map(t => (
              <TaskCard key={t.id} task={t} currentUserId={profile?.id ?? ''}
                onCompletar={completar} onPosponer={setPosponer} onDescartar={setDescartar} />
            ))}
            {filteredTasks.length === 0 && <p className="text-center text-gray-400 py-8">No hay tareas en esta categoría.</p>}
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
