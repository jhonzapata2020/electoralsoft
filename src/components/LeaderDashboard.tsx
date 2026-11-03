'use client';

import React, { useState, useEffect } from 'react';
import { UsuarioSistema, Votante, NivelEstudio } from '../types';
import {
  Menu,
  UserPlus,
  Users,
  Award,
  Phone,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  FileText,
  AlertCircle,
  Loader2,
  Check,
  RefreshCw,
  Send,
  Briefcase
} from 'lucide-react';
import MobileDrawer from './MobileDrawer';
import { getCachedTerritory, registerVoter, getLocalVoters } from '../lib/offline-sync';
import { supabase } from '../lib/supabase';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { formatTitleCase } from '../lib/formatters';

interface Props {
  currentUser: UsuarioSistema;
  voters: Votante[];
  onLogout: () => void;
  onVoterAdded: (newVoter: Votante) => void;
}

export default function LeaderDashboard({ currentUser, voters, onLogout, onVoterAdded }: Props) {
  // Navegación de Pantallas
  const [activeScreen, setActiveScreen] = useState<'registro' | 'lista' | 'meta'>('registro');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Tipo de Formulario: Rápido (15 segundos) o Detallado
  const [tipoFormulario, setTipoFormulario] = useState<'rapido' | 'detallado'>('rapido');

  // Estado del Formulario
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [estudio, setEstudio] = useState<NivelEstudio>('bachiller');
  const [profesion, setProfesion] = useState('');
  const [correo, setCorreo] = useState('');

  // Territorio
  const isUrbano = currentUser.zona === 'urbano';
  const [juntaId, setJuntaId] = useState<number>(currentUser.junta_directiva_id || 1);
  const [barrioId, setBarrioId] = useState<number | ''>(currentUser.barrio_id || '');
  const [corregimientoId, setCorregimientoId] = useState<number>(currentUser.corregimiento_id || 1);
  const [veredaId, setVeredaId] = useState<number | ''>(currentUser.vereda_id || '');

  // Validaciones
  const [checkingDoc, setCheckingDoc] = useState(false);
  const [docExists, setDocExists] = useState<boolean | null>(null);
  const [docErrorMsg, setDocErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Búsqueda en Lista
  const [searchTerm, setSearchTerm] = useState('');

  const territory = getCachedTerritory();
  const availableBarrios = territory.barrios.filter((b) => Number(b.junta_directiva_id) === Number(juntaId));
  const displayBarrios = availableBarrios.length > 0 ? availableBarrios : territory.barrios;
  const availableVeredas = territory.veredas.filter((v) => Number(v.corregimiento_id) === Number(corregimientoId));
  const displayVeredas = availableVeredas.length > 0 ? availableVeredas : territory.veredas;
  const { isOnline, pendingCount, syncNow } = useNetworkStatus();

  // Inicializar Barrio / Vereda
  useEffect(() => {
    if (isUrbano && availableBarrios.length > 0 && !barrioId) {
      setBarrioId(availableBarrios[0].id);
    }
  }, [availableBarrios, isUrbano, barrioId]);

  useEffect(() => {
    if (!isUrbano && availableVeredas.length > 0 && !veredaId) {
      setVeredaId(availableVeredas[0].id);
    }
  }, [availableVeredas, isUrbano, veredaId]);

  // Validación de Cédula en tiempo real
  useEffect(() => {
    const docClean = documento.trim();
    if (docClean.length < 5) {
      setDocExists(null);
      setDocErrorMsg('');
      return;
    }

    const timer = setTimeout(async () => {
      // 1. Revisar cache en teléfono
      const localList = getLocalVoters();
      const inLocal = localList.find((v) => v.documento === docClean);
      if (inLocal) {
        setDocExists(true);
        setDocErrorMsg(`⚠️ Ya registrado por ${inLocal.registrado_por === currentUser.id ? 'ti' : 'otro líder'}.`);
        return;
      }

      // 2. Si hay internet, verificar en Supabase mediante el API seguro
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        setCheckingDoc(true);
        try {
          const res = await fetch(`/api/voters?doc=${encodeURIComponent(docClean)}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.documento) {
              setDocExists(true);
              setDocErrorMsg(`⚠️ Ya registrado (${data.nombre_completo}).`);
            } else {
              setDocExists(false);
              setDocErrorMsg('');
            }
          }
        } catch {
          setDocExists(null);
        } finally {
          setCheckingDoc(false);
        }
      } else {
        setDocExists(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [documento, currentUser.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (docExists) return;
    if (!nombre.trim() || !documento.trim() || !telefono.trim()) {
      alert('Por favor completa los campos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    const selectedBarrio = availableBarrios.find((b) => b.id === Number(barrioId));
    const selectedVereda = availableVeredas.find((v) => v.id === Number(veredaId));

    const formattedNombre = formatTitleCase(nombre);
    const result = await registerVoter({
      documento: documento.trim(),
      nombre_completo: formattedNombre,
      telefono: telefono.trim(),
      estudio_realizado: estudio,
      profesion: profesion.trim() ? formatTitleCase(profesion) : null,
      correo: correo.trim() || null,
      zona: currentUser.zona,
      junta_directiva_id: isUrbano ? Number(juntaId) : null,
      barrio_id: isUrbano ? Number(barrioId) || null : null,
      vereda_id: !isUrbano ? Number(veredaId) || null : null,
      registrado_por: currentUser.id,
      barrio_nombre: selectedBarrio?.nombre,
      vereda_nombre: selectedVereda?.nombre,
      registrador_nombre: currentUser.nombre_completo,
    });

    setIsSubmitting(false);

    if (result.success) {
      onVoterAdded(result.voter);
      setSaveSuccessMsg(`¡${formattedNombre} registrado(a) con éxito!`);
      // Limpiar para el siguiente de inmediato
      setNombre('');
      setDocumento('');
      setTelefono('');
      setProfesion('');
      setCorreo('');
      setDocExists(null);

      setTimeout(() => {
        setSaveSuccessMsg(null);
      }, 3500);
    } else {
      setDocExists(true);
      setDocErrorMsg(result.message);
    }
  };

  // Mis votantes
  const myVoters = voters.filter((v) => v.registrado_por === currentUser.id);
  const total = myVoters.length;
  const meta = currentUser.meta_minima || 25;
  const percent = meta > 0 ? Math.min(100, Math.round((total / meta) * 100)) : 100;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 pb-20">
      {/* Cinta Tricolor Bandera de Turbo */}
      <div className="w-full h-1.5 flex">
        <div className="h-full w-1/3 bg-[#F4BD21]" />
        <div className="h-full w-1/3 bg-[#3FBC24]" />
        <div className="h-full w-1/3 bg-[#0080FF]" />
      </div>

      {/* 
        ================================================================
        HEADER MÓVIL INSTITUCIONAL CON MENÚ HAMBURGUESA
        ================================================================
      */}
      <header className="bg-[#001E72] text-white px-4 py-2.5 sticky top-0 z-30 flex items-center justify-between shadow-md">
        {/* BOTÓN HAMBURGUESA */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 -ml-1 text-white hover:bg-white/10 rounded-xl transition flex items-center justify-center active:scale-95"
          title="Abrir menú"
        >
          <Menu className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Logo Central Proporcional y Destacado */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl shadow-sm">
          <img
            src="/logo-janier.png"
            alt="Janier Lloreda Valencia"
            className="h-9 sm:h-10 w-auto object-contain"
          />
        </div>

        {/* Botón Sincronizar / Enviar si hay pendientes */}
        <button
          onClick={() => syncNow()}
          className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
            pendingCount > 0
              ? 'bg-[#F4BD21] text-slate-950 font-black shadow-md animate-bounce'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title="Enviar datos"
        >
          <RefreshCw className="w-4 h-4" />
          {pendingCount > 0 && <span>{pendingCount}</span>}
        </button>
      </header>

      {/* Menú Lateral Drawer */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentUser={currentUser}
        activeScreen={activeScreen}
        onNavigate={(screen) => setActiveScreen(screen)}
        onLogout={onLogout}
        totalVotantes={total}
      />

      {/* Pestañas de Acceso Rápido Táctiles Superiores */}
      <div className="bg-white border-b border-slate-200 px-3 py-2 flex gap-2 sticky top-[57px] z-20 shadow-sm">
        <button
          onClick={() => setActiveScreen('registro')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
            activeScreen === 'registro'
              ? 'bg-[#0080FF] text-white shadow-md shadow-[#0080FF]/20'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar</span>
        </button>

        <button
          onClick={() => setActiveScreen('lista')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
            activeScreen === 'lista'
              ? 'bg-[#0080FF] text-white shadow-md shadow-[#0080FF]/20'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Mis Personas ({total})</span>
        </button>

        <button
          onClick={() => setActiveScreen('meta')}
          className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition ${
            activeScreen === 'meta'
              ? 'bg-[#0080FF] text-white shadow-md shadow-[#0080FF]/20'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Award className="w-4 h-4 text-[#F4BD21]" />
          <span>{percent}%</span>
        </button>
      </div>

      {/* 
        ================================================================
        PANTALLA 1: FORMULARIO DE REGISTRO (Móvil First, sin modales)
        ================================================================
      */}
      {activeScreen === 'registro' && (
        <main className="max-w-md mx-auto w-full p-4 space-y-4 flex-1">
          {/* Selector de Tipo de Formulario: Rápido vs Detallado */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex shadow-sm">
            <button
              type="button"
              onClick={() => setTipoFormulario('rapido')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                tipoFormulario === 'rapido'
                  ? 'bg-[#0080FF] text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-[#F4BD21]" />
              <span>Registro Rápido (15s)</span>
            </button>
            <button
              type="button"
              onClick={() => setTipoFormulario('detallado')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                tipoFormulario === 'detallado'
                  ? 'bg-[#0080FF] text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Registro Completo</span>
            </button>
          </div>

          {/* Tarjeta del Formulario Táctil */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xl shadow-slate-200/70 space-y-4">
            {saveSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-[#3FBC24] flex items-center gap-2 font-bold text-xs shadow-sm animate-fade-in">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-[#3FBC24]" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Cédula */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Cédula *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value.replace(/\D/g, ''))}
                    placeholder="Número de Cédula"
                    className={`w-full bg-slate-50 border rounded-2xl px-4 py-3.5 text-slate-900 text-base font-semibold focus:bg-white focus:outline-none transition ${
                      docExists === true
                        ? 'border-red-400 focus:border-red-500'
                        : docExists === false
                        ? 'border-emerald-400 focus:border-emerald-500'
                        : 'border-slate-200 focus:border-[#0080FF] focus:ring-2 focus:ring-[#0080FF]/20'
                    }`}
                  />
                  <div className="absolute right-3.5 top-3.5">
                    {checkingDoc ? (
                      <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                    ) : docExists === true ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : docExists === false ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : null}
                  </div>
                </div>
                {docErrorMsg && <p className="text-xs text-red-600 font-bold mt-1">{docErrorMsg}</p>}
                {docExists === false && <p className="text-xs text-emerald-600 font-bold mt-1">✓ Cédula disponible</p>}
              </div>

              {/* Nombre Completo */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  onBlur={() => setNombre(formatTitleCase(nombre))}
                  placeholder="Nombres y Apellidos"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 text-base font-semibold focus:bg-white focus:border-[#0080FF] focus:ring-2 focus:ring-[#0080FF]/20 focus:outline-none"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Teléfono Celular *
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="300 000 0000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 text-base font-semibold focus:bg-white focus:border-[#0080FF] focus:ring-2 focus:ring-[#0080FF]/20 focus:outline-none"
                />
              </div>

              {/* Territorio: Barrio o Vereda */}
              {isUrbano ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Barrio *
                  </label>
                  <select
                    required
                    value={barrioId}
                    onChange={(e) => setBarrioId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 text-sm font-semibold focus:bg-white focus:border-[#0080FF]"
                  >
                    {displayBarrios.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Corregimiento</label>
                    <select
                      value={corregimientoId}
                      onChange={(e) => setCorregimientoId(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-slate-900 text-xs font-semibold"
                    >
                      {territory.corregimientos.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Vereda</label>
                    <select
                      value={veredaId}
                      onChange={(e) => setVeredaId(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-slate-900 text-xs font-semibold"
                    >
                      {displayVeredas.map((v) => (
                        <option key={v.id} value={v.id}>{v.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Campos Extra solo si eligen Registro Completo */}
              {tipoFormulario === 'detallado' && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Nivel de Estudios
                    </label>
                    <select
                      value={estudio}
                      onChange={(e) => setEstudio(e.target.value as NivelEstudio)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-sm font-semibold focus:bg-white focus:border-[#0080FF]"
                    >
                      <option value="primaria">Primaria</option>
                      <option value="bachiller">Bachiller</option>
                      <option value="tecnico">Técnico</option>
                      <option value="tecnologo">Tecnólogo</option>
                      <option value="profesional">Profesional</option>
                      <option value="posgrado">Posgrado</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Profesión u Oficio
                      </label>
                      <span className="text-[11px] text-[#0080FF] font-semibold">Banco de Hojas de Vida</span>
                    </div>
                    <input
                      type="text"
                      value={profesion}
                      onChange={(e) => setProfesion(e.target.value)}
                      onBlur={() => setProfesion(formatTitleCase(profesion))}
                      placeholder="Ej. Enfermera, Abogado, Contador, Docente..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-sm font-semibold focus:bg-white focus:border-[#0080FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Correo Electrónico (Opcional)
                    </label>
                    <input
                      type="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-sm font-semibold focus:bg-white focus:border-[#0080FF]"
                    />
                  </div>
                </>
              )}

              {/* Botón Guardar Táctil Gigante */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || docExists === true}
                  className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-[#0080FF] hover:bg-[#0070e0] active:scale-[0.99] text-white shadow-xl shadow-[#0080FF]/30 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 stroke-[2.5]" /> GUARDAR PERSONA
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-slate-400 font-semibold mt-2">
                  📶 Guarda en tu teléfono sin señal. Enviarás los datos cuando haya internet.
                </p>
              </div>
            </form>
          </div>
        </main>
      )}

      {/* 
        ================================================================
        PANTALLA 2: MIS PERSONAS REGISTRADAS
        ================================================================
      */}
      {activeScreen === 'lista' && (
        <main className="max-w-md mx-auto w-full p-4 space-y-3 flex-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cédula o nombre..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:border-[#0080FF] focus:outline-none shadow-sm"
            />
          </div>

          {myVoters.length === 0 ? (
            <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-3xl space-y-2 mt-4">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-700 text-xs font-bold">
                Aún no has registrado personas.
              </p>
              <button
                onClick={() => setActiveScreen('registro')}
                className="px-4 py-2 bg-[#0080FF] text-white text-xs font-bold rounded-xl"
              >
                Comenzar a Registrar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myVoters
                .filter(
                  (v) =>
                    v.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    v.documento.includes(searchTerm)
                )
                .map((v) => {
                  const initials = v.nombre_completo
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                  const cleanTel = v.telefono.replace(/\D/g, '');
                  const telWhatsApp = cleanTel.startsWith('57') ? cleanTel : `57${cleanTel}`;

                  return (
                    <div
                      key={v.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar con Iniciales Institucionales */}
                        <div className="w-11 h-11 rounded-2xl bg-[#001E72] text-white flex items-center justify-center font-black text-sm shadow-sm border-b-2 border-[#F4BD21] shrink-0">
                          {initials}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-black text-sm text-slate-900 truncate">{v.nombre_completo}</span>
                            {v._synced !== false ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#2f961a] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                <CheckCircle2 className="w-3 h-3" /> Servidor
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                                <Clock className="w-3 h-3" /> Celular
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 font-medium mt-0.5">
                            <span>CC: <strong className="text-slate-800 font-mono">{v.documento}</strong></span>
                            <span>•</span>
                            <span className="text-slate-600 font-semibold truncate">{v.barrio_nombre || v.vereda_nombre || 'Turbo'}</span>
                            {v.profesion && (
                              <>
                                <span>•</span>
                                <span className="text-[#0080FF] font-bold text-[11px] bg-blue-50 px-1.5 py-0.5 rounded">
                                  💼 {v.profesion}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botones Táctiles de Acción Rápida (Llamar y WhatsApp) */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <a
                          href={`tel:${v.telefono}`}
                          className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#0080FF]" />
                          <span>Llamar</span>
                        </a>
                        <a
                          href={`https://api.whatsapp.com/send?phone=${telWhatsApp}&text=${encodeURIComponent(
                            `Hola ${v.nombre_completo}, te saludamos del equipo de Janier Lloreda (SOMOS NUEVAS ACCIONES).`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 rounded-xl bg-[#3FBC24]/15 hover:bg-[#3FBC24]/25 text-[#2f961a] font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </main>
      )}

      {/* 
        ================================================================
        BARRA DE NAVEGACIÓN INFERIOR FIJA (ESTILO ARISTOTLE / APP MÓVIL)
        Para que el líder o secretaria navegue cómodamente con el pulgar
        ================================================================
      */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-4 flex items-center justify-around z-30 shadow-lg select-none">
        <button
          onClick={() => setActiveScreen('registro')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition active:scale-95 ${
            activeScreen === 'registro'
              ? 'text-[#0080FF] font-black'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <UserPlus className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[10px]">Registrar</span>
        </button>

        <button
          onClick={() => setActiveScreen('lista')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition active:scale-95 relative ${
            activeScreen === 'lista'
              ? 'text-[#0080FF] font-black'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <Users className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[10px]">Mis Personas</span>
          {total > 0 && (
            <span className="absolute top-0 right-1 bg-[#F4BD21] text-[#001E72] text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
              {total}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveScreen('meta')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition active:scale-95 ${
            activeScreen === 'meta'
              ? 'text-[#0080FF] font-black'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <Award className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[10px]">Mi Meta ({percent}%)</span>
        </button>
      </nav>

    </div>
  );
}
