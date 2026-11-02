'use client';

import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function NetworkBanner() {
  const { isOnline, pendingCount, isSyncing, notification, clearNotification, syncNow } = useNetworkStatus();

  return (
    <>
      {/* Toast Flotante de Notificación Inteligente */}
      {notification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-fade-in">
          <div className="flex items-center gap-3 p-4 rounded-2xl shadow-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl text-white">
            {notification.includes('✅') || notification.includes('📶') ? (
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 text-xs font-medium leading-relaxed">{notification}</div>
            <button
              onClick={clearNotification}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Indicador Minimalista Flotante en Pantalla (Discreto y Elegante) */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        {!isOnline ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 backdrop-blur-md shadow-lg text-xs font-semibold animate-pulse">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Modo Sin Señal ({pendingCount} local)</span>
          </div>
        ) : pendingCount > 0 ? (
          <button
            onClick={syncNow}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400/30 backdrop-blur-md shadow-lg text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : `Subir ${pendingCount} a Supabase`}</span>
          </button>
        ) : null}
      </div>
    </>
  );
}
