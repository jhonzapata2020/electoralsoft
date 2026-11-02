'use client';

import React from 'react';
import { UsuarioSistema } from '../types';
import {
  X,
  UserPlus,
  Users,
  Award,
  RefreshCw,
  LogOut,
  Wifi,
  WifiOff,
  Phone,
  Shield,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UsuarioSistema;
  activeScreen: 'registro' | 'lista' | 'meta';
  onNavigate: (screen: 'registro' | 'lista' | 'meta') => void;
  onLogout: () => void;
  totalVotantes: number;
}

export default function MobileDrawer({
  isOpen,
  onClose,
  currentUser,
  activeScreen,
  onNavigate,
  onLogout,
  totalVotantes,
}: Props) {
  const { isOnline, pendingCount, isSyncing, syncNow } = useNetworkStatus();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in">
      {/* Fondo oscuro para cerrar al tocar fuera */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Menú Lateral Deslizable (Drawer) */}
      <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-slide-right">
        {/* Cabecera del Menú Institucional */}
        <div>
          {/* Cinta Tricolor Bandera de Turbo */}
          <div className="w-full h-1.5 flex">
            <div className="h-full w-1/3 bg-[#F4BD21]" />
            <div className="h-full w-1/3 bg-[#3FBC24]" />
            <div className="h-full w-1/3 bg-[#0080FF]" />
          </div>

          <div className="bg-[#001E72] text-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="bg-white px-3 py-1.5 rounded-2xl shadow-sm flex items-center gap-2">
                <img
                  src="/logo-janier.png"
                  alt="Janier Lloreda Valencia"
                  className="h-9 w-auto object-contain"
                />
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#00CFFF] block">
                {currentUser.rol.replace(/_/g, ' ')}
              </span>
              <h3 className="text-base font-black text-white truncate">
                {currentUser.nombre_completo}
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                CC: {currentUser.documento} • {currentUser.zona === 'urbano' ? `Equipo #${currentUser.junta_directiva_id || 1}` : 'Rural'}
              </p>
            </div>
          </div>

          {/* Estado de Señal y Botón Enviar Datos */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-slate-700">
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4 text-[#3FBC24]" />
                    <span>Conectado a Internet</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-amber-600" />
                    <span className="text-amber-700">Modo Sin Señal (Local)</span>
                  </>
                )}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {pendingCount} por subir
              </span>
            </div>

            {/* BOTÓN PARA ENVIAR INFORMACIÓN ACUMULADA */}
            <button
              onClick={() => syncNow()}
              disabled={isSyncing || !isOnline}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition ${
                isOnline
                  ? 'bg-[#3FBC24] hover:bg-[#349e1e] text-white active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing
                  ? 'Enviando a Base de Datos...'
                  : pendingCount > 0
                  ? `Enviar ${pendingCount} Datos Pendientes`
                  : 'Sincronizar Información'}
              </span>
            </button>
          </div>

          {/* Opciones de Navegación del Usuario */}
          <nav className="p-3 space-y-1 text-sm font-bold text-slate-700">
            <button
              onClick={() => {
                onNavigate('registro');
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition ${
                activeScreen === 'registro'
                  ? 'bg-blue-50 text-[#0080FF]'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <UserPlus className="w-5 h-5 text-[#0080FF]" />
              <span>Formulario de Registro</span>
            </button>

            <button
              onClick={() => {
                onNavigate('lista');
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition ${
                activeScreen === 'lista'
                  ? 'bg-blue-50 text-[#0080FF]'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#0080FF]" />
                <span>Personas Registradas</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-bold">
                {totalVotantes}
              </span>
            </button>

            <button
              onClick={() => {
                onNavigate('meta');
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition ${
                activeScreen === 'meta'
                  ? 'bg-blue-50 text-[#0080FF]'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Award className="w-5 h-5 text-[#F4BD21]" />
              <span>Mi Meta de Cumplimiento</span>
            </button>
          </nav>
        </div>

        {/* Botón Salir */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}
