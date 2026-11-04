'use client';

import React, { useRef } from 'react';
import { X, Printer, Download, FileText, CheckCircle2, Award, Users, MapPin, Briefcase } from 'lucide-react';
import { Votante, UsuarioSistema } from '../types';
import { getCachedTerritory } from '../lib/offline-sync';
import { formatTitleCase } from '../lib/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  voters: Votante[];
  currentUser: UsuarioSistema;
  onExportExcel: () => void;
}

export default function ReportPdfModal({
  isOpen,
  onClose,
  voters,
  currentUser,
  onExportExcel,
}: Props) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const territory = getCachedTerritory();
  const fechaGeneracion = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalVotantes = voters.length;
  const urbanos = voters.filter((v) => v.zona === 'urbano').length;
  const rurales = voters.filter((v) => v.zona === 'rural').length;

  // Conteo de profesiones y niveles
  const profesionales = voters.filter((v) => v.estudio_realizado === 'profesional' || v.estudio_realizado === 'posgrado').length;
  const tecnicos = voters.filter((v) => v.estudio_realizado === 'tecnico' || v.estudio_realizado === 'tecnologo').length;
  const bachilleres = voters.filter((v) => v.estudio_realizado === 'bachiller' || v.estudio_realizado === 'primaria').length;

  // Barrios cubiertos
  const barriosCubiertos = new Set(
    voters.filter((v) => v.barrio_id || v.barrio_nombre).map((v) => v.barrio_nombre || v.barrio_id)
  ).size;

  // Juntas cubiertas
  const juntasCubiertas = new Set(
    voters.filter((v) => v.junta_directiva_id).map((v) => v.junta_directiva_id)
  ).size;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:static">
      {/* Contenedor Principal Adaptable para Celulares (Volteable en Horizontal) y PC */}
      <div className="bg-white w-full sm:max-w-5xl h-full sm:h-[94vh] rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 print:border-none print:shadow-none print:h-auto print:max-w-none print:rounded-none">
        
        {/* Barra Superior de Herramientas (Oculta en Impresión / PDF) */}
        <div className="px-4 py-3 bg-[#001E72] text-white flex items-center justify-between border-b border-white/10 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0080FF] flex items-center justify-center text-white font-black text-sm">
              📄
            </div>
            <div>
              <h3 className="text-sm font-black text-white leading-tight">Reporte Oficial de Campaña</h3>
              <p className="text-[11px] text-blue-200">Formato Ejecutivo PDF • Janier Lloreda Valencia</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#3FBC24] hover:bg-[#349e1e] active:scale-95 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-sm transition"
              title="Guardar como PDF o Mandar a Imprimir"
            >
              <Printer className="w-4 h-4" />
              <span>Guardar PDF / Imprimir</span>
            </button>

            <button
              onClick={onExportExcel}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              title="Descargar también en Excel"
            >
              <Download className="w-4 h-4 text-[#F4BD21]" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Aviso Móvil de Rotación */}
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-1.5 text-center sm:hidden text-[11px] font-semibold text-[#001E72] print:hidden">
          📱 <em>Consejo: Puedes voltear tu celular en horizontal para ver la tabla completa y más grande.</em>
        </div>

        {/* Documento Imprimible / Visualizador con Scroll Suave */}
        <div
          ref={printAreaRef}
          className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-8 bg-slate-50 print:bg-white print:p-0 print:overflow-visible touch-pan-x"
        >
          <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-2xl sm:shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-2 print:max-w-none">
            
            {/* Membrete Oficial de la Campaña */}
            <div className="border-b-2 border-[#001E72] pb-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-[#001E72] text-white flex flex-col items-center justify-center p-1.5 shadow-sm shrink-0 border-b-4 border-[#F4BD21]">
                  <span className="text-[9px] font-black tracking-widest text-[#F4BD21] leading-none">SOMOS</span>
                  <span className="text-base font-black tracking-tighter leading-none mt-0.5">2026</span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#001E72] uppercase tracking-tight leading-none">
                    JANIER LLOREDA VALENCIA
                  </h1>
                  <p className="text-xs sm:text-sm font-bold text-[#0080FF] tracking-wide mt-0.5 uppercase">
                    SOMOS NUEVAS ACCIONES • TURBO, ANTIOQUIA
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Sala de Mando y Control Electoral • Distrito de Turbo
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0">
                <p className="font-bold text-slate-900">REPORTE OFICIAL DEL CENSO</p>
                <p className="text-[11px] text-slate-500 capitalize">{fechaGeneracion}</p>
                <p className="text-[11px] text-slate-500">
                  Emitido por: <strong className="text-slate-800">{currentUser.nombre_completo}</strong>
                </p>
              </div>
            </div>

            {/* Resumen Ejecutivo de Indicadores Clave */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Simpatizantes</span>
                <span className="text-2xl font-black text-[#001E72] block mt-0.5">{totalVotantes}</span>
                <span className="text-[10px] text-slate-500 font-medium">{urbanos} urb. • {rurales} rur.</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Juntas Activas</span>
                <span className="text-2xl font-black text-[#0080FF] block mt-0.5">{juntasCubiertas} <span className="text-xs font-normal text-slate-400">/ 11</span></span>
                <span className="text-[10px] text-slate-500 font-medium">Juntas Directivas</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Barrios Cubiertos</span>
                <span className="text-2xl font-black text-[#3FBC24] block mt-0.5">{barriosCubiertos} <span className="text-xs font-normal text-slate-400">/ 40</span></span>
                <span className="text-[10px] text-slate-500 font-medium">Equipos Operativos</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Banco de Perfiles</span>
                <span className="text-2xl font-black text-[#F4BD21] block mt-0.5">{profesionales + tecnicos}</span>
                <span className="text-[10px] text-slate-500 font-medium">{profesionales} prof. • {tecnicos} técn.</span>
              </div>
            </div>

            {/* Listado de Simpatizantes y Registro de Hojas de Vida */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0080FF]" /> Censo Detallado de Personas ({voters.length})
                </h2>
                <span className="text-xs text-slate-500 font-semibold">Distrito de Turbo</span>
              </div>

              {voters.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-sm">
                  No hay personas registradas aún en el censo.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#001E72] text-white font-bold uppercase text-[10px] tracking-wider">
                        <th className="p-2 border border-slate-300 w-8 text-center">#</th>
                        <th className="p-2 border border-slate-300">Nombre Completo</th>
                        <th className="p-2 border border-slate-300">Cédula</th>
                        <th className="p-2 border border-slate-300">Teléfono</th>
                        <th className="p-2 border border-slate-300">Barrio / Vereda</th>
                        <th className="p-2 border border-slate-300">Nivel de Estudio</th>
                        <th className="p-2 border border-slate-300">Profesión u Oficio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {voters.map((v, idx) => (
                        <tr
                          key={v.id || idx}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                        >
                          <td className="p-2 border border-slate-200 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="p-2 border border-slate-200 font-bold text-slate-900">
                            {formatTitleCase(v.nombre_completo)}
                          </td>
                          <td className="p-2 border border-slate-200 font-mono text-slate-700">
                            {v.documento}
                          </td>
                          <td className="p-2 border border-slate-200 font-mono text-slate-700">
                            {v.telefono}
                          </td>
                          <td className="p-2 border border-slate-200 text-slate-700">
                            {v.barrio_nombre || v.vereda_nombre || (v.barrio_id ? `Barrio ${v.barrio_id}` : 'Turbo')}
                          </td>
                          <td className="p-2 border border-slate-200 capitalize text-slate-700">
                            {v.estudio_realizado || 'Bachiller'}
                          </td>
                          <td className="p-2 border border-slate-200 font-semibold text-[#001E72]">
                            {v.profesion ? (
                              <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-[#0080FF] rounded font-bold">
                                {formatTitleCase(v.profesion)}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal italic">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pie de Firma Institucional */}
            <div className="pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-slate-500">
              <div>
                <p className="font-black text-slate-800 uppercase">Campaña Janier Lloreda Valencia</p>
                <p className="text-[11px] text-slate-500">SOMOS NUEVAS ACCIONES • 2026</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-mono text-slate-400">Documento de Uso Electoral Interno y Confidencial</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
