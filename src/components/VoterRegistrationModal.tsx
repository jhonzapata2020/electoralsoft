'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, CheckCircle2, AlertCircle, Loader2, Phone, User, GraduationCap, MapPin, Mail, Briefcase } from 'lucide-react';
import { UsuarioSistema, NivelEstudio, Votante } from '../types';
import { getCachedTerritory, registerVoter, getLocalVoters } from '../lib/offline-sync';
import { supabase } from '../lib/supabase';
import { formatTitleCase } from '../lib/formatters';

interface Props {
  currentUser: UsuarioSistema;
  isOpen: boolean;
  onClose: () => void;
  onVoterAdded: (newVoter: Votante) => void;
}

export default function VoterRegistrationModal({ currentUser, isOpen, onClose, onVoterAdded }: Props) {
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [estudio, setEstudio] = useState<NivelEstudio>('bachiller');
  const [profesion, setProfesion] = useState('');
  const [correo, setCorreo] = useState('');

  // Territorio
  const isUrbano = currentUser.zona === 'urbano';
  const [juntaId, setJuntaId] = useState<number | ''>(currentUser.junta_directiva_id || 1);
  const [barrioId, setBarrioId] = useState<number | ''>(currentUser.barrio_id || '');
  const [corregimientoId, setCorregimientoId] = useState<number | ''>(currentUser.corregimiento_id || 1);
  const [veredaId, setVeredaId] = useState<number | ''>(currentUser.vereda_id || '');

  // Validaciones
  const [checkingDoc, setCheckingDoc] = useState(false);
  const [docExists, setDocExists] = useState<boolean | null>(null);
  const [docErrorMsg, setDocErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  const territory = getCachedTerritory();
  const availableBarrios = territory.barrios.filter((b) => (juntaId ? Number(b.junta_directiva_id) === Number(juntaId) : true));
  const displayBarrios = availableBarrios.length > 0 ? availableBarrios : territory.barrios;
  const availableVeredas = territory.veredas.filter((v) => (corregimientoId ? Number(v.corregimiento_id) === Number(corregimientoId) : true));
  const displayVeredas = availableVeredas.length > 0 ? availableVeredas : territory.veredas;

  useEffect(() => {
    if (isOpen) {
      setNombre('');
      setDocumento('');
      setTelefono('');
      setEstudio('bachiller');
      setProfesion('');
      setCorreo('');
      setDocExists(null);
      setDocErrorMsg('');
      setSubmitSuccess(null);
      setIsFormExpanded(false);
      if (currentUser.junta_directiva_id) setJuntaId(currentUser.junta_directiva_id);
      if (currentUser.barrio_id) setBarrioId(currentUser.barrio_id);
      if (currentUser.corregimiento_id) setCorregimientoId(currentUser.corregimiento_id);
      if (currentUser.vereda_id) setVeredaId(currentUser.vereda_id);
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (isUrbano && availableBarrios.length > 0 && (!barrioId || !availableBarrios.some((b) => b.id === Number(barrioId)))) {
      setBarrioId(availableBarrios[0].id);
    }
  }, [juntaId, availableBarrios, isUrbano, barrioId]);

  useEffect(() => {
    if (!isUrbano && availableVeredas.length > 0 && (!veredaId || !availableVeredas.some((v) => v.id === Number(veredaId)))) {
      setVeredaId(availableVeredas[0].id);
    }
  }, [corregimientoId, availableVeredas, isUrbano, veredaId]);

  // Validación de duplicidad en tiempo real
  useEffect(() => {
    const docClean = documento.trim();
    if (docClean.length < 5) {
      setDocExists(null);
      setDocErrorMsg('');
      return;
    }

    const timer = setTimeout(async () => {
      // 1. Revisar cache local en el teléfono
      const localList = getLocalVoters();
      const inLocal = localList.find((v) => v.documento === docClean);
      if (inLocal) {
        setDocExists(true);
        setDocErrorMsg(`⚠️ Ya registrado localmente por ${inLocal.registrado_por === currentUser.id ? 'ti' : 'otro líder'}.`);
        return;
      }

      // 2. Si hay señal, verificar en Supabase mediante el API seguro
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        setCheckingDoc(true);
        try {
          const res = await fetch(`/api/voters?doc=${encodeURIComponent(docClean)}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.documento) {
              setDocExists(true);
              setDocErrorMsg(`⚠️ Ya registrado en la base de datos (${data.nombre_completo}).`);
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
    }, 400);

    return () => clearTimeout(timer);
  }, [documento, currentUser.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (docExists) return;
    if (!nombre.trim() || !documento.trim() || !telefono.trim()) {
      alert('Completa los campos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    const selectedBarrio = availableBarrios.find((b) => b.id === Number(barrioId));
    const selectedVereda = availableVeredas.find((v) => v.id === Number(veredaId));

    const result = await registerVoter({
      documento: documento.trim(),
      nombre_completo: formatTitleCase(nombre),
      telefono: telefono.trim(),
      estudio_realizado: estudio,
      profesion: profesion.trim() ? formatTitleCase(profesion) : null,
      correo: correo.trim() || null,
      zona: currentUser.zona,
      junta_directiva_id: isUrbano ? Number(juntaId) || null : null,
      barrio_id: isUrbano ? Number(barrioId) || null : null,
      vereda_id: !isUrbano ? Number(veredaId) || null : null,
      registrado_por: currentUser.id,
      barrio_nombre: selectedBarrio?.nombre,
      vereda_nombre: selectedVereda?.nombre,
      registrador_nombre: currentUser.nombre_completo,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSubmitSuccess(result.message);
      onVoterAdded(result.voter);
      setTimeout(() => {
        onClose();
      }, 1100);
    } else {
      setDocExists(true);
      setDocErrorMsg(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      {/* Contenedor Adaptable Móvil (Bottom Sheet en Celular / Modal en Tablet y PC) */}
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col border border-slate-200">
        
        {/* Cabecera Móvil Táctil */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0080FF] text-white flex items-center justify-center shadow-md shadow-[#0080FF]/30">
              <UserPlus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Registrar Nueva Persona</h3>
              <p className="text-xs text-slate-500 font-semibold">
                Líder: <strong className="text-[#0080FF]">{currentUser.nombre_completo}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario Mobile-First Táctil (Con Efecto Expansión Inteligente para Adultos Mayores) */}
        <form onSubmit={handleSubmit} className={`overflow-y-auto flex-1 transition-all duration-300 ${
          isFormExpanded ? 'p-5 sm:p-6 space-y-5 bg-white' : 'p-5 space-y-4'
        }`}>
          {/* Banner de Modo Enfoque Ampliado */}
          {isFormExpanded && (
            <div className="flex items-center justify-between pb-3 border-b border-blue-100 bg-blue-50/70 -mx-5 -mt-5 sm:-mx-6 sm:-mt-6 p-4 rounded-t-none animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3FBC24] animate-pulse shrink-0" />
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#001E72] block">
                    Modo Enfoque • Letra Grande
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Campos ampliados para lectura fácil
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormExpanded(false)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-black rounded-xl border border-slate-200 shadow-xs transition active:scale-95"
              >
                Contraer ✕
              </button>
            </div>
          )}

          {submitSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#3FBC24] flex items-center gap-2.5 shadow-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p className="text-xs font-bold">{submitSuccess}</p>
            </div>
          )}

          {/* Cédula */}
          <div>
            <label className={`block uppercase tracking-wider text-slate-800 transition-all ${
              isFormExpanded ? 'text-xs sm:text-sm font-black mb-1.5' : 'text-xs font-bold mb-1'
            }`}>
              Cédula de Ciudadanía *
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                required
                value={documento}
                onFocus={() => setIsFormExpanded(true)}
                onChange={(e) => setDocumento(e.target.value.replace(/\D/g, ''))}
                placeholder={isFormExpanded ? 'Escribe aquí el número de cédula...' : 'Ej. 1017123456'}
                className={`w-full bg-slate-50 border rounded-2xl transition-all duration-200 ${
                  isFormExpanded
                    ? 'px-5 py-4.5 sm:py-5 text-xl font-black placeholder:text-base text-slate-950'
                    : 'px-4 py-3.5 text-base font-semibold text-slate-900'
                } focus:bg-white focus:outline-none ${
                  docExists === true
                    ? 'border-red-400 focus:border-red-500'
                    : docExists === false
                    ? 'border-emerald-400 focus:border-emerald-500'
                    : 'border-slate-200 focus:border-[#0080FF] focus:ring-2 focus:ring-[#0080FF]/20'
                }`}
              />
              <div className={`absolute right-4 ${isFormExpanded ? 'top-5' : 'top-3.5'}`}>
                {checkingDoc ? (
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                ) : docExists === true ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : docExists === false ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : null}
              </div>
            </div>
            {docErrorMsg && <p className="text-xs text-red-600 font-bold mt-1.5">{docErrorMsg}</p>}
            {docExists === false && <p className="text-xs text-emerald-600 font-bold mt-1.5">✓ Cédula disponible para registrar</p>}
          </div>

          {/* Nombre Completo */}
          <div>
            <label className={`block uppercase tracking-wider text-slate-800 transition-all ${
              isFormExpanded ? 'text-xs sm:text-sm font-black mb-1.5' : 'text-xs font-bold mb-1'
            }`}>
              Nombre Completo *
            </label>
            <div className="relative">
              <User className={`absolute left-4 text-slate-400 pointer-events-none ${isFormExpanded ? 'w-6 h-6 top-4.5' : 'w-5 h-5 top-3.5'}`} />
              <input
                type="text"
                required
                value={nombre}
                onFocus={() => setIsFormExpanded(true)}
                onChange={(e) => setNombre(e.target.value)}
                onBlur={() => setNombre(formatTitleCase(nombre))}
                placeholder={isFormExpanded ? 'Escribe los Nombres y Apellidos completos...' : 'Nombres y Apellidos'}
                className={`w-full bg-slate-50 border border-slate-200 rounded-2xl transition-all duration-200 ${
                  isFormExpanded
                    ? 'pl-13 pr-5 py-4 sm:py-4.5 text-lg font-bold placeholder:text-base text-slate-950'
                    : 'pl-11 pr-4 py-3.5 text-base font-semibold text-slate-900'
                } focus:bg-white focus:border-[#0080FF] focus:ring-2 focus:ring-[#0080FF]/20 focus:outline-none`}
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className={`block uppercase tracking-wider text-slate-800 transition-all ${
              isFormExpanded ? 'text-xs sm:text-sm font-black mb-1.5' : 'text-xs font-bold mb-1'
            }`}>
              Teléfono Celular *
            </label>
            <div className="relative">
              <Phone className={`absolute left-4 text-slate-400 pointer-events-none ${isFormExpanded ? 'w-6 h-6 top-4.5' : 'w-5 h-5 top-3.5'}`} />
              <input
                type="tel"
                inputMode="tel"
                required
                value={telefono}
                onFocus={() => setIsFormExpanded(true)}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder={isFormExpanded ? 'Número de Celular (ej. 300 123 4567)...' : '300 000 0000'}
                className={`w-full bg-slate-50 border border-slate-200 rounded-2xl transition-all duration-200 ${
                  isFormExpanded
                    ? 'pl-13 pr-5 py-4 sm:py-4.5 text-lg font-bold font-mono placeholder:text-base text-slate-950'
                    : 'pl-11 pr-4 py-3.5 text-base font-semibold text-slate-900'
                } focus:bg-white focus:border-[#0080FF] focus:ring-2 focus:ring-[#0080FF]/20 focus:outline-none`}
              />
            </div>
          </div>

          {/* Territorio: Barrio o Vereda */}
          {isUrbano ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Equipo Operativo
                </label>
                <select
                  disabled={Boolean(currentUser.junta_directiva_id && currentUser.rol !== 'gerente_general')}
                  value={juntaId}
                  onChange={(e) => setJuntaId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3.5 text-slate-900 text-sm font-semibold disabled:opacity-60"
                >
                  {territory.juntas.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Barrio *
                </label>
                <select
                  required
                  value={barrioId}
                  onChange={(e) => setBarrioId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3.5 text-slate-900 text-sm font-semibold focus:bg-white focus:border-[#0080FF]"
                >
                  {displayBarrios.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Corregimiento
                </label>
                <select
                  value={corregimientoId}
                  onChange={(e) => setCorregimientoId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3.5 text-slate-900 text-sm font-semibold"
                >
                  {territory.corregimientos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Vereda *
                </label>
                <select
                  required
                  value={veredaId}
                  onChange={(e) => setVeredaId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3.5 text-slate-900 text-sm font-semibold focus:bg-white focus:border-[#0080FF]"
                >
                  {displayVeredas.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Nivel de Estudio */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nivel de Estudios *
            </label>
            <div className="relative">
              <GraduationCap className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
              <select
                value={estudio}
                onChange={(e) => setEstudio(e.target.value as NivelEstudio)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-slate-900 text-sm font-semibold focus:bg-white focus:border-[#0080FF] focus:outline-none appearance-none"
              >
                <option value="primaria">Primaria</option>
                <option value="bachiller">Bachiller</option>
                <option value="tecnico">Técnico</option>
                <option value="tecnologo">Tecnólogo</option>
                <option value="profesional">Profesional</option>
                <option value="posgrado">Posgrado</option>
              </select>
            </div>
          </div>

          {/* Profesión u Oficio (Banco de Hojas de Vida) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Profesión u Oficio
              </label>
              <span className="text-[11px] text-[#0080FF] font-semibold">Banco de Hojas de Vida</span>
            </div>
            <div className="relative">
              <Briefcase className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={profesion}
                onChange={(e) => setProfesion(e.target.value)}
                onBlur={() => setProfesion(formatTitleCase(profesion))}
                placeholder="Ej. Enfermera, Abogado, Contador, Docente, Conductor..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-slate-900 text-sm font-semibold focus:bg-white focus:border-[#0080FF] focus:ring-2 focus:ring-[#0080FF]/20 focus:outline-none transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              💡 Permite a Janier ubicar hojas de vida cuando surjan vacantes o convocatorias.
            </p>
          </div>

          {/* Botón Guardar Táctil Gigante */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || docExists === true}
              className={`w-full rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 bg-[#0080FF] hover:bg-[#0070e0] active:scale-[0.99] text-white shadow-xl shadow-[#0080FF]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all ${
                isFormExpanded ? 'py-5 text-base sm:text-lg shadow-[#0080FF]/40' : 'py-4 text-sm'
              }`}
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
              📶 Funciona sin internet. Guarda en el teléfono y sube solo al haber señal.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
