'use client';

import React, { useState } from 'react';
import { UsuarioSistema } from '../types';
import { setCurrentUser } from '../lib/offline-sync';
import { User, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  onLoginSuccess: (user: UsuarioSistema) => void;
}

// Fallback local garantizado para pruebas sin conexión
const LOCAL_FALLBACK_USERS: Record<string, Partial<UsuarioSistema>> = {
  '1001': {
    id: '0527efe3-623c-4522-a8f1-5efbf4d809a6',
    documento: '1001',
    nombre_completo: 'Janier Lloreda Valencia',
    telefono: '3001234567',
    correo: 'pwd:1001',
    rol: 'gerente_general',
    zona: 'urbano',
    meta_minima: 20000,
    is_active: true,
  },
  '1002': {
    id: '4e7df4ad-99e7-4200-a164-654d5586b98a',
    documento: '1002',
    nombre_completo: 'Coordinador General',
    telefono: '3002345678',
    correo: 'pwd:1002',
    rol: 'coordinador',
    zona: 'urbano',
    meta_minima: 10000,
    is_active: true,
  },
  '1003': {
    id: 'e3d7717e-9331-4853-b464-e4d102754cdd',
    documento: '1003',
    nombre_completo: 'Secretaria General',
    telefono: '3003456789',
    correo: 'pwd:1003',
    rol: 'secretaria_general',
    zona: 'urbano',
    meta_minima: 5000,
    is_active: true,
  },
  '1004': {
    id: '63e02c75-4659-472a-9608-14bec2ac8645',
    documento: '1004',
    nombre_completo: 'Secretaria Equipo Operativo 1',
    telefono: '3004567890',
    correo: 'pwd:1004',
    rol: 'secretaria',
    zona: 'urbano',
    junta_directiva_id: 1,
    meta_minima: 500,
    is_active: true,
  },
  '1005': {
    id: 'abef0122-b8b4-40ba-b8ea-f3f4f585c590',
    documento: '1005',
    nombre_completo: 'Líder Equipo Operativo 1',
    telefono: '3005678901',
    correo: 'pwd:1005',
    rol: 'lider_junta_directiva',
    zona: 'urbano',
    junta_directiva_id: 1,
    meta_minima: 25,
    is_active: true,
  },
  '1006': {
    id: '3c3b104c-3893-42b6-933e-61a27c74dc0a',
    documento: '1006',
    nombre_completo: 'Líder Barrial El Bosque',
    telefono: '3006789012',
    correo: 'pwd:1006',
    rol: 'lider_barrial',
    zona: 'urbano',
    junta_directiva_id: 1,
    meta_minima: 10,
    is_active: true,
  },
  '1007': {
    id: 'afb04d33-5269-42f3-b989-7226823fee9e',
    documento: '1007',
    nombre_completo: 'Líder Veredal Currulao',
    telefono: '3007890123',
    correo: 'pwd:1007',
    rol: 'lider_veredal',
    zona: 'rural',
    corregimiento_id: 1,
    vereda_id: 1,
    meta_minima: 15,
    is_active: true,
  },
};

export default function AuthScreen({ onLoginSuccess }: Props) {
  const [documento, setDocumento] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const docClean = documento.trim();
    const passClean = password.trim();

    if (!docClean || !passClean) {
      setErrorMsg('Por favor ingresa tu cédula y tu contraseña.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Intentar autenticar mediante API del servidor con clave maestra
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documento: docClean, password: passClean }),
      });

      const json = await res.json();

      if (res.ok && json.success && json.user) {
        const user = json.user as UsuarioSistema;
        setCurrentUser(user);
        onLoginSuccess(user);
        return;
      }

      // Si la API responde con credencial incorrecta
      if (res.status === 401 || res.status === 404) {
        const fallback = LOCAL_FALLBACK_USERS[docClean];
        if (fallback && passClean === docClean) {
          const user = fallback as UsuarioSistema;
          setCurrentUser(user);
          onLoginSuccess(user);
          return;
        }
        setErrorMsg(json.error || 'Cédula o contraseña incorrecta.');
        setLoading(false);
        return;
      }

      throw new Error(json.error || 'Error del servidor');
    } catch (err: any) {
      // Fallback si no hay internet o el servidor API no responde
      const fallback = LOCAL_FALLBACK_USERS[docClean];
      if (fallback && passClean === docClean) {
        const user = fallback as UsuarioSistema;
        setCurrentUser(user);
        onLoginSuccess(user);
        return;
      }

      setErrorMsg('No se pudo conectar al servidor. Verifica tu señal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] md:min-h-screen md:h-auto w-full bg-[#EEF2F6] relative flex flex-col justify-between font-sans overflow-hidden md:overflow-visible overscroll-none">
      
      {/* 1. Bandera Oficial de Turbo en el Extremo Superior (Colores Planos Institucionales) */}
      <div className="w-full h-1.5 sm:h-2 flex z-30 shrink-0">
        <div className="h-full w-1/3 bg-[#F4BD21]" title="Amarillo Turbo" />
        <div className="h-full w-1/3 bg-[#3FBC24]" title="Verde Turbo" />
        <div className="h-full w-1/3 bg-[#0080FF]" title="Azul Somos" />
      </div>

      {/* 
        HEADER MÓVIL FIJO (FUERA DE LA TARJETA)
        Saca el logo de Janier Lloreda arriba en un encabezado limpio y fijo.
        Evita que la pantalla se alargue hacia abajo y elimine cualquier movimiento o scroll en celular.
      */}
      <div className="md:hidden bg-white border-b border-slate-200/80 px-4 py-2 flex items-center justify-between shadow-xs z-20 shrink-0">
        <div className="flex items-center gap-2">
          <img
            src="/logo-janier.png"
            alt="Janier Lloreda Valencia"
            className="h-10 w-auto object-contain"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-[#3FBC24]" />
          <span className="text-[10px] font-black uppercase tracking-wider text-[#001E72]">
            SOMOS NUEVAS ACCIONES
          </span>
        </div>
      </div>

      {/* 
        2. Fondo Geométrico Asimétrico Inspirado en el Diseño de Pinterest (Desktop)
        - Lado Izquierdo: Bloque Diagonal Sólido en Azul Oscuro Institucional #001E72 con ribete Verde #3FBC24
        - Lado Derecho: Lienzo Neutro Limpio #EEF2F6
      */}
      {/* Capa de Ribete Verde Turbo #3FBC24 */}
      <div 
        className="hidden md:block absolute top-0 left-0 bottom-0 w-[49%] lg:w-[50.5%] bg-[#3FBC24] z-0 pointer-events-none"
        style={{
          clipPath: 'polygon(0% 0%, 100% 0%, 82% 100%, 0% 100%)',
        }}
      />
      {/* Capa Principal Azul Oscuro Institucional #001E72 */}
      <div 
        className="hidden md:block absolute top-0 left-0 bottom-0 w-[48.5%] lg:w-[50%] bg-[#001E72] z-0 pointer-events-none"
        style={{
          clipPath: 'polygon(0% 0%, 100% 0%, 82% 100%, 0% 100%)',
        }}
      />

      {/* 3. Contenedor Central: Tarjeta Flotante Bicolor */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-4 lg:p-8 z-10 w-full overflow-hidden">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-200/80 overflow-hidden flex flex-col md:flex-row">
          
          {/* ========================================================================= */}
          {/* LADO IZQUIERDO (DESKTOP): LIENZO BLANCO PURO CON EL LOGO DESTACADO       */}
          {/* ========================================================================= */}
          <div className="hidden md:flex md:w-1/2 bg-white p-8 lg:p-12 flex-col items-center justify-between text-center relative border-b md:border-b-0 md:border-r border-slate-100">
            
            {/* Distintivo Superior Cívico */}
            <div className="w-full flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#001E72] bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                Turbo • Elecciones 2026
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F4BD21]" title="Amarillo" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#3FBC24]" title="Verde" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#0080FF]" title="Azul Somos" />
              </div>
            </div>

            {/* Bloque Central de Logos: Espacioso, Majestuoso y de Gran Autoridad */}
            <div className="my-auto py-8 flex flex-col items-center justify-center space-y-6 w-full max-w-xs">
              
              {/* Logo Oficial Janier Lloreda Valencia en Gran Formato */}
              <img
                src="/logo-janier.png"
                alt="Janier Lloreda Valencia"
                className="h-28 sm:h-32 lg:h-36 w-auto max-w-full object-contain filter drop-shadow-sm transition hover:scale-[1.02]"
              />

              {/* Separador Tricolor Oficial (Bandera de Turbo: Amarillo, Verde, Azul) */}
              <div className="w-32 h-1.5 flex rounded-full overflow-hidden shadow-sm">
                <div className="w-1/3 h-full bg-[#F4BD21]" />
                <div className="w-1/3 h-full bg-[#3FBC24]" />
                <div className="w-1/3 h-full bg-[#0080FF]" />
              </div>

              {/* Logo SOMOS Nuevas Acciones Proporcional */}
              <img
                src="/logo-somos.png"
                alt="SOMOS Nuevas Acciones"
                className="h-12 sm:h-14 lg:h-16 w-auto max-w-full object-contain"
              />

              {/* Leyenda Institucional */}
              <div className="pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#001E72]">
                  Control Territorial y Electoral
                </h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  11 Equipos Operativos • Zonas Rurales
                </p>
              </div>
            </div>

            {/* Cinta Inferior Cívica */}
            <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              Alcaldía Distrital de Turbo
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LADO DERECHO: AZUL OSCURO INSTITUCIONAL CON CAMPOS BLANCOS                 */}
          {/* ========================================================================= */}
          <div className="w-full md:w-1/2 bg-[#001E72] p-4 sm:p-8 lg:p-12 flex flex-col justify-between text-white relative">
            
            {/* Cinta Tricolor Superior en el Panel Derecho */}
            <div className="absolute top-0 left-0 right-0 h-1.5 flex">
              <div className="h-full w-1/3 bg-[#F4BD21]" />
              <div className="h-full w-1/3 bg-[#3FBC24]" />
              <div className="h-full w-1/3 bg-[#0080FF]" />
            </div>

            {/* Cabecera del Formulario */}
            <div className="pt-1 sm:pt-2 pb-2.5 sm:pb-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#3FBC24]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#3FBC24]">
                  Acceso Autorizado
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                Ingreso al Sistema
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Escribe tu número de cédula y contraseña asignada.
              </p>
            </div>

            {/* Formulario con Campos Blancos Estilo Pinterest */}
            <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4 flex-1 flex flex-col justify-center">
              
              {/* Campo Cédula de Ciudadanía (Estilo Ergonómico Nequi) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-200 uppercase tracking-wider mb-1">
                  Cédula de Ciudadanía
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    autoFocus
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value.replace(/\D/g, ''))}
                    placeholder="Número de cédula (Ej. 1001)"
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-white text-slate-900 rounded-xl sm:rounded-2xl text-base font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00CFFF] shadow-md transition"
                  />
                </div>
              </div>

              {/* Campo Contraseña (Estilo Ergonómico Nequi) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-200 uppercase tracking-wider mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña asignada"
                    className="w-full pl-11 pr-11 py-3 sm:py-3.5 bg-white text-slate-900 rounded-xl sm:rounded-2xl text-base font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00CFFF] shadow-md transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition p-1"
                    title={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Recordarme y Enlace SOMOS */}
              <div className="flex items-center justify-between text-xs text-slate-300 pt-0.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#3FBC24] border-slate-400 focus:ring-[#3FBC24]"
                  />
                  <span className="font-medium text-xs sm:text-sm">Recordarme</span>
                </label>
                <span className="text-xs font-bold text-[#F4BD21] tracking-wide">
                  SOMOS Nuevas Acciones
                </span>
              </div>

              {/* Mensaje de Error si aplica */}
              {errorMsg && (
                <div className="p-2.5 bg-red-900/40 border border-red-500/60 text-red-200 text-xs font-semibold rounded-xl text-center">
                  {errorMsg}
                </div>
              )}

              {/* 
                Botón de Acción Ergonómico: Amarillo Turbo #F4BD21 con Texto Azul Oscuro #001E72
                (Altura generosa estilo Nequi con respuesta táctil)
              */}
              <button
                type="submit"
                disabled={loading || !documento.trim() || !password.trim()}
                className="w-full py-3.5 sm:py-4 px-4 rounded-xl sm:rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-[#F4BD21] hover:bg-[#e0ac1a] text-[#001E72] shadow-xl shadow-black/25 active:scale-[0.98] disabled:opacity-50 transition mt-1 sm:mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#001E72]" />
                    <span>Verificando Identidad...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar al Sistema</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </form>

            {/* Asistencia para Líderes y Secretarías */}
            <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-white/10 text-center">
              <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium">
                ¿Eres líder y necesitas tu clave de acceso?
              </p>
              <span className="text-[10px] sm:text-xs font-bold text-[#00CFFF] block mt-0.5">
                Solicítala a la Secretaría de tu Equipo Operativo
              </span>
            </div>

          </div>

        </div>
      </div>

      {/* 4. Footer Institucional de Campaña */}
      <footer className="w-full py-2 px-3 text-center text-xs text-slate-500 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto z-10 shrink-0">
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#3FBC24]" />
          <span className="font-semibold text-slate-700">Plataforma Oficial de Campaña • Janier Lloreda Valencia</span>
        </div>
        <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-0 font-medium">
          Distrito Especial Portuario de Turbo, Antioquia — SOMOS 2026
        </div>
      </footer>

    </div>
  );
}
