'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  X,
  RotateCcw,
  GraduationCap,
  Briefcase,
  MapPin,
  UserCheck,
  Phone,
  Layers,
  ChevronDown,
  Sparkles,
  Building,
  Check
} from 'lucide-react';
import { UsuarioSistema } from '../types';
import { formatTitleCase } from '../lib/formatters';

export interface VoterFilterState {
  search: string;
  estudio: string;
  profesion: string;
  zona: string; // 'todas' | 'urbano' | 'rural'
  juntaId: string; // 'todas' | number
  barrioId: string; // 'todos' | number
  corregimientoId: string; // 'todos' | number
  veredaId: string; // 'todas' | number
  liderId: string; // 'todos' | id
  telefono: string; // 'todos' | 'con' | 'sin'
}

export const initialFilterState: VoterFilterState = {
  search: '',
  estudio: 'todos',
  profesion: '',
  zona: 'todas',
  juntaId: 'todas',
  barrioId: 'todos',
  corregimientoId: 'todos',
  veredaId: 'todas',
  liderId: 'todos',
  telefono: 'todos',
};

export function countActiveFilters(filters: VoterFilterState): number {
  let count = 0;
  if (filters.search.trim()) count++;
  if (filters.estudio !== 'todos') count++;
  if (filters.profesion.trim()) count++;
  if (filters.zona !== 'todas') count++;
  if (filters.juntaId !== 'todas') count++;
  if (filters.barrioId !== 'todos') count++;
  if (filters.corregimientoId !== 'todos') count++;
  if (filters.veredaId !== 'todas') count++;
  if (filters.liderId !== 'todos') count++;
  if (filters.telefono !== 'todos') count++;
  return count;
}

interface Props {
  filters: VoterFilterState;
  onChange: (filters: VoterFilterState) => void;
  totalMatches: number;
  totalVoters: number;
  availableProfessions: [string, number][]; // [profesion, count]
  systemUsers: UsuarioSistema[];
  territory: {
    juntas: { id: number; nombre: string }[];
    barrios: { id: number; nombre: string; junta_directiva_id: number }[];
    corregimientos: { id: number; nombre: string }[];
    veredas: { id: number; nombre: string; corregimiento_id: number }[];
  };
  onCloseMobile?: () => void;
  onCollapsePc?: () => void;
  isMobileModal?: boolean;
}

export default function VoterFilterSidebar({
  filters,
  onChange,
  totalMatches,
  totalVoters,
  availableProfessions,
  systemUsers,
  territory,
  onCloseMobile,
  onCollapsePc,
  isMobileModal = false,
}: Props) {
  const [activeTab, setActiveTab] = useState<'filtros' | 'presets'>('filtros');
  const activeCount = countActiveFilters(filters);

  const update = (patch: Partial<VoterFilterState>) => {
    onChange({ ...filters, ...patch });
  };

  const handleReset = () => {
    onChange(initialFilterState);
  };

  // Filtrar barrios según la junta elegida
  const availableBarrios =
    filters.juntaId === 'todas'
      ? territory.barrios
      : territory.barrios.filter((b) => String(b.junta_directiva_id) === String(filters.juntaId));

  // Filtrar veredas según el corregimiento elegido
  const availableVeredas =
    filters.corregimientoId === 'todos'
      ? territory.veredas
      : territory.veredas.filter((v) => String(v.corregimiento_id) === String(filters.corregimientoId));

  // Filtrar solo líderes / coordinadores para el selector
  const leadersList = systemUsers.filter(
    (u) =>
      u.rol === 'lider_junta_directiva' ||
      u.rol === 'lider_equipo_operativo' ||
      u.rol === 'coordinador' ||
      u.rol === 'secretaria'
  );

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col ${
      isMobileModal ? 'max-h-[85vh]' : 'max-h-[calc(100vh-120px)]'
    }`}>
      {/* 
        ====================================================================
        CABECERA ESTILO ARISTÓTELES (Pestañas Superiores: SIMPLE / FILTROS / PRESETS)
        ====================================================================
      */}
      <div className="bg-slate-50 border-b border-slate-200 p-3.5 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#001E72] text-white flex items-center justify-center shadow-sm">
              <Filter className="w-4 h-4 text-[#F4BD21]" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <span>Filtros Aristóteles</span>
                {activeCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#0080FF] text-white text-[10px] font-black flex items-center justify-center">
                    {activeCount}
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-slate-500 font-semibold">
                {totalMatches} de {totalVoters} simpatizantes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                title="Limpiar todos los filtros"
                className="px-2 py-1 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}

            {isMobileModal && onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {!isMobileModal && onCollapsePc && (
              <button
                type="button"
                onClick={onCollapsePc}
                title="Ocultar barra de filtros"
                className="px-2 py-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition text-[11px] font-bold flex items-center gap-1"
              >
                <span>◀ Ocultar</span>
              </button>
            )}
          </div>
        </div>

        {/* Pestañas Aristóteles */}
        <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('filtros')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              activeTab === 'filtros'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Filtros Detallados
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              activeTab === 'presets'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vistas Rápidas
          </button>
        </div>
      </div>

      {/* 
        ====================================================================
        CUERPO CON SCROLL DE FILTROS EN PASTEL (IDÉNTICO A ARISTÓTELES)
        ====================================================================
      */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {/* PESTAÑA 2: VISTAS RÁPIDAS PRE-CONFIGURADAS */}
        {activeTab === 'presets' && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-[11px] text-slate-500 font-semibold mb-2">
              Haz clic en una vista pre-establecida para aplicarla al instante:
            </p>

            <button
              type="button"
              onClick={() =>
                onChange({
                  ...initialFilterState,
                  estudio: 'profesional',
                })
              }
              className="w-full text-left p-3 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-slate-900 transition flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-black block text-amber-900">🎓 Banco de Profesionales</span>
                <span className="text-[11px] text-amber-700 font-medium">Hojas de vida con título universitario</span>
              </div>
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() =>
                onChange({
                  ...initialFilterState,
                  zona: 'rural',
                })
              }
              className="w-full text-left p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-slate-900 transition flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-black block text-emerald-900">🌾 Zona Rural (Veredas)</span>
                <span className="text-[11px] text-emerald-700 font-medium">Corregimientos y veredas de Turbo</span>
              </div>
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() =>
                onChange({
                  ...initialFilterState,
                  zona: 'urbano',
                })
              }
              className="w-full text-left p-3 rounded-2xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-slate-900 transition flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-black block text-blue-900">🏙️ Casco Urbano (11 Juntas)</span>
                <span className="text-[11px] text-blue-700 font-medium">Barrios urbanos de Turbo</span>
              </div>
              <Building className="w-4 h-4 text-blue-600 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() =>
                onChange({
                  ...initialFilterState,
                  telefono: 'con',
                })
              }
              className="w-full text-left p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-slate-900 transition flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-black block text-indigo-900">📱 Con Celular Directo</span>
                <span className="text-[11px] text-indigo-700 font-medium">Listos para campañas de WhatsApp</span>
              </div>
              <Phone className="w-4 h-4 text-indigo-600 shrink-0" />
            </button>
          </div>
        )}

        {/* PESTAÑA 1: FILTROS DETALLADOS (ESTILO ARISTÓTELES) */}
        {activeTab === 'filtros' && (
          <div className="space-y-3 animate-fade-in">
            {/* 1. BUSCADOR DIRECTO */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                Búsqueda Rápida
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => update({ search: e.target.value })}
                  placeholder="Nombre, cédula o palabra..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-semibold placeholder:text-slate-400 focus:bg-white focus:border-[#0080FF] focus:outline-none"
                />
                {filters.search && (
                  <button
                    type="button"
                    onClick={() => update({ search: '' })}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. PROFESIÓN U OFICIO (BANCO DE HOJAS DE VIDA - ARISTÓTELES YELLOW) */}
            <div className="p-3 rounded-2xl bg-[#FEF9C3] border border-[#FEF08A] text-[#854D0E] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#A16207]" />
                  <span>Profesión u Oficio</span>
                </label>
                {filters.profesion && (
                  <button
                    type="button"
                    onClick={() => update({ profesion: '' })}
                    className="text-[10px] font-bold text-red-600 hover:underline"
                  >
                    Quitar ✕
                  </button>
                )}
              </div>

              <input
                type="text"
                value={filters.profesion}
                onChange={(e) => update({ profesion: e.target.value })}
                placeholder="Ej. Enfermera, Abogado, Contador..."
                className="w-full bg-white/90 border border-amber-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-semibold placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:outline-none"
              />

              {/* Pastillas rápidas de profesiones detectadas en la BD */}
              {availableProfessions.length > 0 && (
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-amber-900 block mb-1">
                    Más registradas en Turbo:
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                    {availableProfessions.slice(0, 8).map(([prof, count]) => (
                      <button
                        key={prof}
                        type="button"
                        onClick={() => update({ profesion: filters.profesion === prof ? '' : prof })}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition ${
                          filters.profesion.toLowerCase() === prof.toLowerCase()
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white/80 hover:bg-white text-amber-900 border-amber-200'
                        }`}
                      >
                        {prof} <span className="opacity-70 font-mono">({count})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. NIVEL DE ESTUDIO (ARISTÓTELES MINT GREEN) */}
            <div className="p-3 rounded-2xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#166534] space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#15803D]" />
                <span>Nivel de Estudio</span>
              </label>
              <select
                value={filters.estudio}
                onChange={(e) => update({ estudio: e.target.value })}
                className="w-full bg-white/95 border border-emerald-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:bg-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="todos">Todos los niveles</option>
                <option value="profesional">🎓 Profesional / Posgrado</option>
                <option value="tecnico">⚙️ Técnico / Tecnólogo</option>
                <option value="bachiller">📚 Bachiller</option>
                <option value="primaria">✏️ Primaria</option>
              </select>
            </div>

            {/* 4. TERRITORIO: ZONA, JUNTAS Y BARRIOS (ARISTÓTELES SKY BLUE) */}
            <div className="p-3 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1] space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Territorio y Zonas</span>
              </label>

              {/* Selector Zona: Todas, Urbano, Rural */}
              <div className="grid grid-cols-3 gap-1 bg-white/80 p-1 rounded-xl text-[11px] font-bold border border-sky-200">
                <button
                  type="button"
                  onClick={() => update({ zona: 'todas' })}
                  className={`py-1 rounded-lg transition ${
                    filters.zona === 'todas'
                      ? 'bg-[#0080FF] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => update({ zona: 'urbano' })}
                  className={`py-1 rounded-lg transition ${
                    filters.zona === 'urbano'
                      ? 'bg-[#0080FF] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Urbana
                </button>
                <button
                  type="button"
                  onClick={() => update({ zona: 'rural' })}
                  className={`py-1 rounded-lg transition ${
                    filters.zona === 'rural'
                      ? 'bg-[#0080FF] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Rural
                </button>
              </div>

              {/* Si es Urbano o Todas: Selector de Junta Directiva 1 a 11 */}
              {filters.zona !== 'rural' && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-sky-900 block">Junta Directiva (1 a 11):</span>
                  <select
                    value={filters.juntaId}
                    onChange={(e) => update({ juntaId: e.target.value, barrioId: 'todos' })}
                    className="w-full bg-white/95 border border-sky-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="todas">Todas las Juntas (1 a 11)</option>
                    {territory.juntas.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Si es Urbano o Todas: Selector de Barrio */}
              {filters.zona !== 'rural' && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-sky-900 block">Barrio:</span>
                  <select
                    value={filters.barrioId}
                    onChange={(e) => update({ barrioId: e.target.value })}
                    className="w-full bg-white/95 border border-sky-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="todos">Todos los Barrios</option>
                    {availableBarrios.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Si es Rural: Selector de Corregimiento y Vereda */}
              {filters.zona === 'rural' && (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-sky-900 block">Corregimiento:</span>
                    <select
                      value={filters.corregimientoId}
                      onChange={(e) => update({ corregimientoId: e.target.value, veredaId: 'todas' })}
                      className="w-full bg-white/95 border border-sky-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-sky-500 focus:outline-none"
                    >
                      <option value="todos">Todos los Corregimientos</option>
                      {territory.corregimientos.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-sky-900 block">Vereda:</span>
                    <select
                      value={filters.veredaId}
                      onChange={(e) => update({ veredaId: e.target.value })}
                      className="w-full bg-white/95 border border-sky-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-sky-500 focus:outline-none"
                    >
                      <option value="todas">Todas las Veredas</option>
                      {availableVeredas.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* 5. LÍDER / REGISTRADOR (ARISTÓTELES PEACH / APRICOT) */}
            <div className="p-3 rounded-2xl bg-[#FFEDD5] border border-[#FED7AA] text-[#C2410C] space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#EA580C]" />
                <span>Líder Registrador</span>
              </label>
              <select
                value={filters.liderId}
                onChange={(e) => update({ liderId: e.target.value })}
                className="w-full bg-white/95 border border-orange-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:bg-white focus:border-orange-500 focus:outline-none"
              >
                <option value="todos">Todos los líderes ({leadersList.length})</option>
                {leadersList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {formatTitleCase(l.nombre_completo)}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. CONTACTO TELEFÓNICO (ARISTÓTELES LAVENDER) */}
            <div className="p-3 rounded-2xl bg-[#EDE9FE] border border-[#DDD6FE] text-[#6D28D9] space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Teléfono Celular</span>
              </label>
              <select
                value={filters.telefono}
                onChange={(e) => update({ telefono: e.target.value })}
                className="w-full bg-white/95 border border-purple-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:bg-white focus:border-purple-500 focus:outline-none"
              >
                <option value="todos">Todos (Con y sin teléfono)</option>
                <option value="con">📱 Solo con teléfono registrado</option>
                <option value="sin">⚠️ Sin número de teléfono</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* PIE DEL SIDEBAR: BOTÓN APLICAR / CERRAR EN MÓVIL */}
      {isMobileModal && (
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl active:scale-95 transition"
          >
            Limpiar Filtros
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex-1 py-2.5 bg-[#001E72] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition"
          >
            Ver {totalMatches} Resultados
          </button>
        </div>
      )}
    </div>
  );
}
