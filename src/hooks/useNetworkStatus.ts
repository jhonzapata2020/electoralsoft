'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPendingSyncCount, processSyncQueue, setupAutoSync } from '../lib/offline-sync';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const updateCounts = useCallback(() => {
    setPendingCount(getPendingSyncCount());
  }, []);

  const triggerNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 6000);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    updateCounts();

    const handleOnline = () => {
      setIsOnline(true);
      updateCounts();
    };

    const handleOffline = () => {
      setIsOnline(false);
      triggerNotification('⚠️ Sin señal de internet. Operando en modo Local (los registros se guardarán en tu celular).');
      updateCounts();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Auto sincronizador
    const cleanupSync = setupAutoSync((msg) => {
      triggerNotification(msg);
      updateCounts();
    });

    const countInterval = setInterval(updateCounts, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      cleanupSync();
      clearInterval(countInterval);
    };
  }, [updateCounts, triggerNotification]);

  const syncNow = async () => {
    if (!navigator.onLine) {
      triggerNotification('No hay conexión a internet actualmente. Esperando señal...');
      return;
    }
    setIsSyncing(true);
    const { syncedCount } = await processSyncQueue((count) => {
      triggerNotification(`✅ ¡Sincronización manual exitosa! ${count} registros subidos a la base de datos.`);
    });
    updateCounts();
    setIsSyncing(false);
    if (syncedCount === 0 && pendingCount === 0) {
      triggerNotification('✨ Todo está al día y sincronizado con Supabase.');
    }
  };

  return {
    isOnline,
    pendingCount,
    isSyncing,
    notification,
    clearNotification: () => setNotification(null),
    syncNow,
    refreshPending: updateCounts,
  };
}
