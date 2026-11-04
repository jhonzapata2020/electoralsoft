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
  ChevronDown,
  ChevronUp,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';
import { UsuarioSistema } from '../types';
import { formatTitleCase } from '../lib/formatters';
import { VoterFilterState, initialFilterState, countActiveFilters } from './VoterFilterSidebar';

interface Props {
  filters: VoterFilterState;
  onChange: (filters: VoterFilterState) => void;
  totalMatches: number;
  totalVoters: number;
  availableProfessions: [string, number][];
  systemUsers: UsuarioSistema[];
  territory: {
    juntas: { id: number; nombre: string }[];
    barrios: { id: number; nombre: string; junta_directiva_id: number }[];
    corregimientos: { id: number; nombre: string }[];
    veredas: { id: number; nombre: string; corregimiento_id: number }[];
  };
  viewMode: 'tabla' | 'tarjetas';
  onViewModeChange: (mode: 'tabla' | 'tarjetas') => void;
  safeCurrentPage: number;
  totalPages: number;
}

export default function VoterFilterTopBar({
  filters,
  onChange,
  totalMatches,
  totalVoters,
  availableProfessions,
  systemUsers,
  territory,
  viewMode,
  onViewModeChange,
  safeCurrentPage,
  totalPages,
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
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

  const leadersList = systemUsers.filter(
    (u) =>
      u.rol === 'lider_junta_directiva' ||
      u.rol === 'lider_equipo_operativo' ||
      u.rol === 'coordinador' ||
      u.rol === 'secretaria'
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* 
        FILA 1: SWITCH MODO CRUD/FICHAS + BUSCADOR + BOTÓN FILTROS + CONTEO Y PÁGINA
      */}
      <div className="p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/60 border-b border-slate-200">
        {/* Izquierda: Switch Modo CRUD / Fichas + Buscador */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Switch de Vista */}
          <div className="inline-flex rounded-xl bg-slate-200/70 p-1 border border-slate-300/80 shrink-0 select-none">
            <button
              type="button"
              onClick={() => onViewModeChange('tabla')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                viewMode === 'tabla'
                  ? 'bg-[#001E72] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
              title="Vista de tabla completa estilo Aristóteles"
            >
              <TableIcon className="w-3.5 h-3.5 text-[#F4BD21]" />
              <span>Modo CRUD</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('tarjetas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                viewMode === 'tarjetas'
                  ? 'bg-[#001E72] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
              title="Vista de fichas individuales"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#0080FF]" />
              <span>Fichas</span>
            </button>
          </div>

          {/* Buscador Rápido Global */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              placeholder="Buscar por cédula, nombre, profesión o barrio..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-900 font-semibold placeholder:text-slate-400 focus:border-[#0080FF] focus:outline-none transition shadow-2xs"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => update({ search: '' })}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botón Filtros Rápidos / Desplegable */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition shrink-0 select-none ${
              showAdvanced || activeCount > 0
                ? 'bg-[#001E72] text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
            }`}
            title="Mostrar más filtros (estudio, profesión, territorio, líder)"
          >
            <Filter className="w-3.5 h-3.5 text-[#F4BD21]" />
            <span>Filtros {activeCount > 0 ? `(${activeCount})` : ''}</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              title="Limpiar todos los filtros"
              className="px-2.5 py-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 border border-red-200"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
        </div>

        {/* Derecha: Conteo y Paginación */}
        <div className="flex items-center gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-1.5 bg-blue-50/80 text-[#001E72] font-black px-2.5 py-1 rounded-lg border border-blue-200">
            <span>{totalMatches}</span>
            <span className="font-semibold text-slate-600">de {totalVoters} votantes</span>
          </div>
          <div className="text-slate-500 font-semibold hidden md:block">
            Página <strong className="text-slate-800">{safeCurrentPage}</strong> de <strong className="text-slate-800">{totalPages}</strong>
          </div>
        </div>
      </div>

      {/* 
        FILA 2: BARRA RÁPIDA DE FILTROS EN LÍNEA (SIEMPRE ACCESIBLE O AL DESPLEGAR)
      */}
      <div className={`p-3 bg-white border-t border-slate-100 transition-all ${showAdvanced ? 'block' : 'hidden lg:block'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* 1. Nivel de Estudio */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-[#0080FF]" />
              <span>Nivel Estudio</span>
            </label>
            <select
              value={filters.estudio}
              onChange={(e) => update({ estudio: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-[#0080FF] focus:outline-none transition"
            >
              <option value="todos">Todos los niveles</option>
              <option value="profesional">🎓 Profesional / Posgrado</option>
              <option value="tecnico">⚙️ Técnico / Tecnólogo</option>
              <option value="bachiller">📚 Bachiller</option>
              <option value="primaria">✏️ Primaria</option>
            </select>
          </div>

          {/* 2. Territorio / Zona */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#3FBC24]" />
              <span>Zona y Territorio</span>
            </label>
            <div className="flex items-center gap-1">
              <select
                value={filters.zona}
                onChange={(e) => update({ zona: e.target.value, juntaId: 'todas', barrioId: 'todos' })}
                className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-[#0080FF] focus:outline-none transition"
              >
                <option value="todas">Todas</option>
                <option value="urbano">🏙️ Urbano</option>
                <option value="rural">🌾 Rural</option>
              </select>

              {filters.zona !== 'rural' ? (
                <select
                  value={filters.juntaId}
                  onChange={(e) => update({ juntaId: e.target.value, barrioId: 'todos' })}
                  className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-[#0080FF] focus:outline-none transition"
                >
                  <option value="todas">11 Juntas</option>
                  {territory.juntas.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={filters.veredaId}
                  onChange={(e) => update({ veredaId: e.target.value })}
                  className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-[#0080FF] focus:outline-none transition"
                >
                  <option value="todas">Veredas</option>
                  {availableVeredas.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* 3. Profesión u Oficio */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-[#A16207]" />
                <span>Profesión u Oficio</span>
              </label>
              {filters.profesion && (
                <button
                  type="button"
                  onClick={() => update({ profesion: '' })}
                  className="text-[10px] font-bold text-red-600 hover:underline"
                >
                  Borrar ✕
                </button>
              )}
            </div>
            <input
              type="text"
              value={filters.profesion}
              onChange={(e) => update({ profesion: e.target.value })}
              placeholder="Ej. Enfermera, Abogado..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold placeholder:text-slate-400 focus:bg-white focus:border-[#0080FF] focus:outline-none transition"
            />
          </div>

          {/* 4. Líder Registrador */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-[#EA580C]" />
              <span>Líder Registrador</span>
            </label>
            <select
              value={filters.liderId}
              onChange={(e) => update({ liderId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-[#0080FF] focus:outline-none transition"
            >
              <option value="todos">Todos los líderes ({leadersList.length})</option>
              {leadersList.map((l) => (
                <option key={l.id} value={l.id}>
                  {formatTitleCase(l.nombre_completo)}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Teléfono Celular */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#7C3AED]" />
              <span>Teléfono Celular</span>
            </label>
            <select
              value={filters.telefono}
              onChange={(e) => update({ telefono: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-[#0080FF] focus:outline-none transition"
            >
              <option value="todos">Todos (Con y sin tel)</option>
              <option value="con">📱 Solo con teléfono</option>
              <option value="sin">⚠️ Sin teléfono</option>
            </select>
          </div>
        </div>

        {/* Pastillas rápidas de profesiones detectadas en el censo */}
        {availableProfessions.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
              Bolsa de Empleo:
            </span>
            {availableProfessions.slice(0, 6).map(([prof, count]) => {
              const isActive = filters.profesion.toLowerCase() === prof.toLowerCase();
              return (
                <button
                  key={prof}
                  type="button"
                  onClick={() => update({ profesion: isActive ? '' : prof })}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition ${
                    isActive
                      ? 'bg-[#001E72] text-white border-[#001E72]'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  💼 {prof} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
