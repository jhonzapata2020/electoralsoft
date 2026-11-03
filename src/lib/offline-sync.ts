import { supabase } from './supabase';
import { Votante, UsuarioSistema, JuntaDirectiva, Barrio, Corregimiento, Vereda } from '../types';
import {
  OFFICIAL_JUNTAS,
  OFFICIAL_BARRIOS,
  OFFICIAL_CORREGIMIENTOS,
  OFFICIAL_VEREDAS,
} from './territory-data';

const STORAGE_KEYS = {
  CURRENT_USER: 'psp_current_user',
  VOTERS_CACHE: 'psp_voters_cache',
  PENDING_VOTERS: 'psp_pending_voters',
  PENDING_USERS: 'psp_pending_users',
  JUNTAS: 'psp_territory_juntas',
  BARRIOS: 'psp_territory_barrios',
  CORREGIMIENTOS: 'psp_territory_corregimientos',
  VEREDAS: 'psp_territory_veredas',
};

// --- Manejo Seguro de LocalStorage ---
function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage`, err);
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage`, err);
  }
}

// --- Usuario Actual (Sesión Offline-Friendly) ---
export function setCurrentUser(user: UsuarioSistema | null): void {
  setStorage(STORAGE_KEYS.CURRENT_USER, user);
}

export function getCurrentUser(): UsuarioSistema | null {
  return getStorage<UsuarioSistema | null>(STORAGE_KEYS.CURRENT_USER, null);
}

// --- Precarga y Cache Territorial ---
export async function syncTerritoryCache(): Promise<{
  juntas: JuntaDirectiva[];
  barrios: Barrio[];
  corregimientos: Corregimiento[];
  veredas: Vereda[];
}> {
  // Si estamos offline, devolver de localStorage
  if (typeof window !== 'undefined' && !navigator.onLine) {
    return {
      juntas: getStorage<JuntaDirectiva[]>(STORAGE_KEYS.JUNTAS, []),
      barrios: getStorage<Barrio[]>(STORAGE_KEYS.BARRIOS, []),
      corregimientos: getStorage<Corregimiento[]>(STORAGE_KEYS.CORREGIMIENTOS, []),
      veredas: getStorage<Vereda[]>(STORAGE_KEYS.VEREDAS, []),
    };
  }

  try {
    const [jRes, bRes, cRes, vRes] = await Promise.all([
      supabase.from('juntas_directivas').select('*').order('numero', { ascending: true }),
      supabase.from('barrios').select('*').order('nombre', { ascending: true }),
      supabase.from('corregimientos').select('*').order('nombre', { ascending: true }),
      supabase.from('veredas').select('*').order('nombre', { ascending: true }),
    ]);

    const juntas = (jRes.data as JuntaDirectiva[]) || getStorage<JuntaDirectiva[]>(STORAGE_KEYS.JUNTAS, []);
    const barrios = (bRes.data as Barrio[]) || getStorage<Barrio[]>(STORAGE_KEYS.BARRIOS, []);
    const corregimientos = (cRes.data as Corregimiento[]) || getStorage<Corregimiento[]>(STORAGE_KEYS.CORREGIMIENTOS, []);
    const veredas = (vRes.data as Vereda[]) || getStorage<Vereda[]>(STORAGE_KEYS.VEREDAS, []);

    setStorage(STORAGE_KEYS.JUNTAS, juntas);
    setStorage(STORAGE_KEYS.BARRIOS, barrios);
    setStorage(STORAGE_KEYS.CORREGIMIENTOS, corregimientos);
    setStorage(STORAGE_KEYS.VEREDAS, veredas);

    return { juntas, barrios, corregimientos, veredas };
  } catch (err) {
    console.warn('No se pudo actualizar territorio remoto, usando caché local', err);
    return {
      juntas: getStorage<JuntaDirectiva[]>(STORAGE_KEYS.JUNTAS, []),
      barrios: getStorage<Barrio[]>(STORAGE_KEYS.BARRIOS, []),
      corregimientos: getStorage<Corregimiento[]>(STORAGE_KEYS.CORREGIMIENTOS, []),
      veredas: getStorage<Vereda[]>(STORAGE_KEYS.VEREDAS, []),
    };
  }
}

// Fallback predeterminado de los 11 Equipos Operativos Oficiales
const DEFAULT_JUNTAS: JuntaDirectiva[] = Array.from({ length: 11 }, (_, i) => ({
  id: i + 1,
  nombre: `Equipo Operativo ${i + 1}`,
  numero: i + 1,
  meta_votantes: 1200,
  is_active: true,
}));

export function getCachedTerritory() {
  const localJuntas = getStorage<JuntaDirectiva[]>(STORAGE_KEYS.JUNTAS, []);
  const localBarrios = getStorage<Barrio[]>(STORAGE_KEYS.BARRIOS, []);
  const localCorregimientos = getStorage<Corregimiento[]>(STORAGE_KEYS.CORREGIMIENTOS, []);
  const localVeredas = getStorage<Vereda[]>(STORAGE_KEYS.VEREDAS, []);

  return {
    juntas: localJuntas.length > 0 ? localJuntas : OFFICIAL_JUNTAS,
    barrios: localBarrios.length > 0 ? localBarrios : OFFICIAL_BARRIOS,
    corregimientos: localCorregimientos.length > 0 ? localCorregimientos : OFFICIAL_CORREGIMIENTOS,
    veredas: localVeredas.length > 0 ? localVeredas : OFFICIAL_VEREDAS,
  };
}

// --- Votantes: Guardado Local y Cola de Sincronización ---
export function getLocalVoters(registradoPorId?: string): Votante[] {
  const voters = getStorage<Votante[]>(STORAGE_KEYS.VOTERS_CACHE, []);
  if (registradoPorId) {
    return voters.filter((v) => v.registrado_por === registradoPorId);
  }
  return voters;
}

export function getPendingSyncCount(): number {
  const pendingVoters = getStorage<Votante[]>(STORAGE_KEYS.PENDING_VOTERS, []);
  const pendingUsers = getStorage<UsuarioSistema[]>(STORAGE_KEYS.PENDING_USERS, []);
  return pendingVoters.length + pendingUsers.length;
}

export async function registerVoter(voterData: Omit<Votante, 'id' | 'created_at'>): Promise<{
  success: boolean;
  voter: Votante;
  isOffline: boolean;
  message: string;
}> {
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'local_' + Date.now();
  const newVoter: Votante = {
    ...voterData,
    id: newId,
    created_at: new Date().toISOString(),
    _is_local: true,
    _synced: false,
  };

  // 1. Guardar de inmediato en cache local
  const currentCache = getStorage<Votante[]>(STORAGE_KEYS.VOTERS_CACHE, []);
  setStorage(STORAGE_KEYS.VOTERS_CACHE, [newVoter, ...currentCache]);

  // 2. Si no hay conexión, agregar a cola de pendientes y avisar
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
  if (!isOnline) {
    const pending = getStorage<Votante[]>(STORAGE_KEYS.PENDING_VOTERS, []);
    setStorage(STORAGE_KEYS.PENDING_VOTERS, [...pending, newVoter]);
    return {
      success: true,
      voter: newVoter,
      isOffline: true,
      message: 'Guardado localmente sin señal. Se enviará a Supabase automáticamente apenas haya conexión.',
    };
  }

  // 3. Si hay conexión, intentar enviar a Supabase inmediatamente por el API Route seguro
  try {
    const { _is_local, _synced, barrio_nombre, vereda_nombre, registrador_nombre, ...payload } = newVoter;
    const res = await fetch('/api/voters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      // Si falló por duplicidad de cédula
      if (res.status === 409 || errData.error?.includes('ya está registrada')) {
        // Remover de cache local
        setStorage(
          STORAGE_KEYS.VOTERS_CACHE,
          currentCache.filter((v) => v.id !== newId)
        );
        return {
          success: false,
          voter: newVoter,
          isOffline: false,
          message: `Error: La cédula ${newVoter.documento} ya está registrada en el sistema.`,
        };
      }
      // Otro error de red/servidor -> encolar para reintentar
      const pending = getStorage<Votante[]>(STORAGE_KEYS.PENDING_VOTERS, []);
      setStorage(STORAGE_KEYS.PENDING_VOTERS, [...pending, newVoter]);
      return {
        success: true,
        voter: newVoter,
        isOffline: true,
        message: 'Guardado localmente. Se reintentará sincronizar con la nube en breve.',
      };
    }

    // Éxito remoto: actualizar en cache local como sincronizado
    newVoter._synced = true;
    newVoter._is_local = false;
    const updatedCache = getStorage<Votante[]>(STORAGE_KEYS.VOTERS_CACHE, []).map((v) =>
      v.id === newId ? { ...v, _synced: true, _is_local: false } : v
    );
    setStorage(STORAGE_KEYS.VOTERS_CACHE, updatedCache);

    return {
      success: true,
      voter: newVoter,
      isOffline: false,
      message: '¡Votante registrado y sincronizado exitosamente en la base de datos!',
    };
  } catch (err: any) {
    // Error inesperado -> guardar en cola
    const pending = getStorage<Votante[]>(STORAGE_KEYS.PENDING_VOTERS, []);
    setStorage(STORAGE_KEYS.PENDING_VOTERS, [...pending, newVoter]);
    return {
      success: true,
      voter: newVoter,
      isOffline: true,
      message: 'Guardado localmente. Se sincronizará automáticamente cuando haya señal.',
    };
  }
}

// --- Proceso de Sincronización Automática de Registros Acumulados ---
let isSyncing = false;

export async function processSyncQueue(
  onSyncSuccess?: (syncedCount: number) => void
): Promise<{ syncedCount: number; errorsCount: number }> {
  if (isSyncing) return { syncedCount: 0, errorsCount: 0 };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { syncedCount: 0, errorsCount: 0 };
  }

  isSyncing = true;
  let syncedCount = 0;
  let errorsCount = 0;

  try {
    // 1. Sincronizar Votantes pendientes
    const pendingVoters = getStorage<Votante[]>(STORAGE_KEYS.PENDING_VOTERS, []);
    if (pendingVoters.length > 0) {
      const remainingVoters: Votante[] = [];

      for (const voter of pendingVoters) {
        try {
          const { _is_local, _synced, barrio_nombre, vereda_nombre, registrador_nombre, ...payload } = voter;
          const res = await fetch('/api/voters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            console.error('Error sincronizando votante:', voter.documento);
            remainingVoters.push(voter);
            errorsCount++;
          } else {
            syncedCount++;
            // Marcar como sincronizado en cache
            const cache = getStorage<Votante[]>(STORAGE_KEYS.VOTERS_CACHE, []);
            const updated = cache.map((c) => (c.id === voter.id ? { ...c, _synced: true, _is_local: false } : c));
            setStorage(STORAGE_KEYS.VOTERS_CACHE, updated);
          }
        } catch (err) {
          remainingVoters.push(voter);
          errorsCount++;
        }
      }

      setStorage(STORAGE_KEYS.PENDING_VOTERS, remainingVoters);
    }

    // 2. Sincronizar Usuarios/Líderes creados offline si los hay
    const pendingUsers = getStorage<UsuarioSistema[]>(STORAGE_KEYS.PENDING_USERS, []);
    if (pendingUsers.length > 0) {
      const remainingUsers: UsuarioSistema[] = [];
      for (const user of pendingUsers) {
        try {
          const { junta_nombre, barrio_nombre, corregimiento_nombre, vereda_nombre, ...payload } = user;
          const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            remainingUsers.push(user);
            errorsCount++;
          } else {
            syncedCount++;
          }
        } catch (err) {
          remainingUsers.push(user);
          errorsCount++;
        }
      }
      setStorage(STORAGE_KEYS.PENDING_USERS, remainingUsers);
    }

    if (syncedCount > 0 && onSyncSuccess) {
      onSyncSuccess(syncedCount);
    }
  } finally {
    isSyncing = false;
  }

  return { syncedCount, errorsCount };
}

// Iniciar Listeners de red automáticos
export function setupAutoSync(onNotification?: (msg: string) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = async () => {
    console.log('[AutoSync] Conexión recuperada. Sincronizando datos...');
    const result = await processSyncQueue((count) => {
      if (onNotification) {
        onNotification(`📶 ¡Conexión restablecida! Se sincronizaron exitosamente ${count} registros a la base de datos.`);
      }
    });
  };

  window.addEventListener('online', handleOnline);

  // Intervalo periódico cada 12 segundos para enviar si hay pendientes y señal
  const intervalId = window.setInterval(async () => {
    if (navigator.onLine && getPendingSyncCount() > 0) {
      await processSyncQueue((count) => {
        if (onNotification) {
          onNotification(`✅ Se sincronizaron automáticamente ${count} registros pendientes con Supabase.`);
        }
      });
    }
  }, 12000);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.clearInterval(intervalId);
  };
}
