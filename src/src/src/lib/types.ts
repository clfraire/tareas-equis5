export type Rol = 'admin' | 'empleado';
export type Tienda = 'mujer' | 'hombre';
export type Prioridad = 'urgente' | 'normal';
export type Frecuencia = 'hora' | 'dia' | 'semana';
export type Estado = 'pendiente' | 'completada' | 'vencida' | 'descartada';

export interface Profile {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  tienda: Tienda | null;
  push_subscription: any;
}

export interface Task {
  id: string;
  titulo: string;
  descripcion: string | null;
  tienda: Tienda;
  asignado_a: string | null;
  prioridad: Prioridad;
  frecuencia: Frecuencia;
  fecha_limite: string;
  tiempo_estimado: number | null;
  estado: Estado;
  completada_por: string | null;
  completada_en: string | null;
  motivo_descarte: string | null;
  created_by: string | null;
  created_at: string;
  profiles?: { nombre: string; email: string } | null;
}
