export type Rol =
  | 'gerente_general'
  | 'coordinador'
  | 'secretaria_general'
  | 'secretaria'
  | 'lider_junta_directiva'
  | 'lider_equipo_operativo'
  | 'lider_barrial'
  | 'lider_veredal';

export type Zona = 'urbano' | 'rural';

export type NivelEstudio =
  | 'primaria'
  | 'bachiller'
  | 'tecnico'
  | 'tecnologo'
  | 'profesional'
  | 'posgrado';

export interface UsuarioSistema {
  id: string;
  documento: string;
  nombre_completo: string;
  telefono: string;
  correo?: string | null;
  rol: Rol;
  zona: Zona;
  junta_directiva_id?: number | null;
  barrio_id?: number | null;
  corregimiento_id?: number | null;
  vereda_id?: number | null;
  lider_inmediato_id?: string | null;
  meta_minima: number;
  is_active: boolean;
  created_at?: string;
  // Metadata frontend
  junta_nombre?: string;
  barrio_nombre?: string;
  corregimiento_nombre?: string;
  vereda_nombre?: string;
}

export interface JuntaDirectiva {
  id: number;
  numero: number;
  nombre: string;
  descripcion?: string | null;
}

export interface Barrio {
  id: number;
  nombre: string;
  junta_directiva_id: number;
}

export interface Corregimiento {
  id: number;
  nombre: string;
}

export interface Vereda {
  id: number;
  nombre: string;
  corregimiento_id: number;
}

export interface Votante {
  id: string;
  documento: string;
  nombre_completo: string;
  telefono: string;
  estudio_realizado: NivelEstudio;
  correo?: string | null;
  zona: Zona;
  junta_directiva_id?: number | null;
  barrio_id?: number | null;
  vereda_id?: number | null;
  registrado_por: string;
  created_at?: string;
  // Campos locales / sincronización
  _is_local?: boolean;
  _synced?: boolean;
  barrio_nombre?: string;
  vereda_nombre?: string;
  registrador_nombre?: string;
}

export interface AvanceLider {
  lider_id: string;
  lider_nombre: string;
  lider_documento: string;
  rol: Rol;
  zona: Zona;
  junta_nombre?: string;
  meta_minima: number;
  total_registrados: number;
  estado_meta?: 'rojo' | 'amarillo' | 'verde';
}
