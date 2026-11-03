'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Send,
  MapPin,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Shield,
  Share2,
  Pencil,
  Save,
  Loader2,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { Votante, NivelEstudio } from '../types';
import { formatTitleCase } from '../lib/formatters';
import { getCachedTerritory, updateVoter } from '../lib/offline-sync';

interface Props {
  voter: Votante | null;
  isOpen: boolean;
  onClose: () => void;
  onVoterUpdated?: (updated: Votante) => void;
  initialEditMode?: boolean;
}

export default function ContactInspectorDrawer({
  voter,
  isOpen,
  onClose,
  onVoterUpdated,
  initialEditMode = false,
}: Props) {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editEstudio, setEditEstudio] = useState<NivelEstudio>('bachiller');
  const [editProfesion, setEditProfesion] = useState('');
  const [editBarrioId, setEditBarrioId] = useState<number | ''>('');
  const [editVeredaId, setEditVeredaId] = useState<number | ''>('');
  const [editCorreo, setEditCorreo] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const territory = getCachedTerritory();

  useEffect(() => {
    if (voter) {
      setEditNombre(voter.nombre_completo || '');
      setEditTelefono(voter.telefono || '');
      setEditEstudio((voter.estudio_realizado as NivelEstudio) || 'bachiller');
      setEditProfesion(voter.profesion || '');
      setEditBarrioId(voter.barrio_id || '');
      setEditVeredaId(voter.vereda_id || '');
      setEditCorreo(voter.correo || '');
      setIsEditing(initialEditMode);
      setSaveError(null);
      setSaveSuccess(null);
    }
  }, [voter, initialEditMode]);

  if (!isOpen || !voter) return null;

  const formattedName = formatTitleCase(voter.nombre_completo);
  const initials = formattedName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const cleanTel = voter.telefono.replace(/\D/g, '');
  const telWhatsApp = cleanTel.startsWith('57') ? cleanTel : `57${cleanTel}`;

  const messageGeneral = encodeURIComponent(
    `Hola ${formattedName}, te saludamos de la campaña de Janier Lloreda (SOMOS NUEVAS ACCIONES).`
  );

  const messageTrabajo = encodeURIComponent(
    `Hola ${formattedName}, te saludamos del equipo de Janier Lloreda (SOMOS NUEVAS ACCIONES). Vimos tu perfil como ${formatTitleCase(
      voter.profesion || 'profesional'
    )} en nuestro banco de hojas de vida. Nos consultaron por un perfil como el tuyo para una vacante/convocatoria laboral. ¿Estás disponible?`
  );

  const isUrbano = voter.zona === 'urbano';

  // Manejar Guardado de Cambios en Supabase y Cache Local
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNombre.trim() || !editTelefono.trim()) {
      setSaveError('Nombre completo y teléfono celular son obligatorios.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    const selectedBarrio = territory.barrios.find((b) => b.id === Number(editBarrioId));
    const selectedVereda = territory.veredas.find((v) => v.id === Number(editVeredaId));

    const result = await updateVoter({
      id: voter.id,
      documento: voter.documento,
      nombre_completo: formatTitleCase(editNombre),
      telefono: editTelefono.trim(),
      estudio_realizado: editEstudio,
      profesion: editProfesion.trim() ? formatTitleCase(editProfesion) : null,
      correo: editCorreo.trim() || null,
      barrio_id: isUrbano ? Number(editBarrioId) || null : null,
      vereda_id: !isUrbano ? Number(editVeredaId) || null : null,
      junta_directiva_id: isUrbano ? selectedBarrio?.junta_directiva_id || voter.junta_directiva_id : null,
      barrio_nombre: selectedBarrio?.nombre,
      vereda_nombre: selectedVereda?.nombre,
    });

    setSaving(false);

    if (result.success && result.voter) {
      setSaveSuccess('¡Perfil y teléfono actualizados con éxito!');
      if (onVoterUpdated) {
        onVoterUpdated(result.voter);
      }
      setTimeout(() => {
        setIsEditing(false);
        setSaveSuccess(null);
      }, 1100);
    } else {
      setSaveError(result.error || 'Error al actualizar en la base de datos');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      {/* Backdrop clicable para cerrar */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel Lateral (Estilo Aristotle Contacts Inspector) */}
      <div className="relative w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 z-10 overflow-hidden animate-slide-left">
        
        {/* Cabecera Azul Aristóteles con Nombre y Acciones */}
        <div className="bg-[#001E72] px-5 py-4 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-black tracking-widest text-[#F4BD21] uppercase block">
              {isEditing ? 'EDITAR CONTACTO' : 'EXPEDIENTE DE CONTACTO'} • ARISTÓTELES
            </span>
            <h3 className="text-base font-black truncate text-white">
              {formattedName}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-2.5 py-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition"
                title="Editar teléfono o datos del votante"
              >
                <Pencil className="w-3.5 h-3.5 text-[#F4BD21]" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 
          ========================================================================
          MODO 1: FORMULARIO DE EDICIÓN EN VIVO (Corrección de Teléfono, Nombre, etc.)
          ========================================================================
        */}
        {isEditing ? (
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 text-slate-800">
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-2.5">
              <Pencil className="w-5 h-5 text-[#0080FF] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-[#001E72] uppercase">
                  Actualización de Datos (Control Admin)
                </h4>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Puedes corregir el teléfono si llamaron o se equivocaron digitándolo. Los cambios se sincronizan en la nube.
                </p>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-[#166534] text-xs font-bold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-[#3FBC24] shrink-0" />
                <span>{saveSuccess}</span>
              </div>
            )}

            {saveError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-300 text-red-700 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Cédula (Lectura) */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                Número de Cédula (Identificador Fijo)
              </label>
              <input
                type="text"
                disabled
                value={voter.documento}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-600 cursor-not-allowed"
              />
            </div>

            {/* Teléfono Celular (CAMPO PRINCIPAL) */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border-2 border-amber-300 space-y-1">
              <label className="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center justify-between">
                <span>📱 Teléfono Celular *</span>
                <span className="text-[10px] text-amber-700 font-semibold">Línea WhatsApp</span>
              </label>
              <input
                type="tel"
                required
                value={editTelefono}
                onChange={(e) => setEditTelefono(e.target.value)}
                placeholder="Ej. 320 710 5318"
                className="w-full bg-white border border-amber-300 rounded-xl px-4 py-3 text-base font-mono font-black text-slate-900 focus:bg-white focus:border-[#0080FF] focus:ring-2 focus:ring-[#0080FF]/20 focus:outline-none"
              />
              <p className="text-[11px] text-amber-800 font-medium">
                💡 Este es el número al que se enviarán las comunicaciones oficiales por WhatsApp.
              </p>
            </div>

            {/* Nombre Completo */}
            <div>
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                placeholder="Nombres y Apellidos"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-[#0080FF] focus:outline-none"
              />
            </div>

            {/* Nivel de Estudio */}
            <div>
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-1">
                Nivel de Estudios
              </label>
              <select
                value={editEstudio}
                onChange={(e) => setEditEstudio(e.target.value as NivelEstudio)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-[#0080FF] focus:outline-none"
              >
                <option value="primaria">Primaria</option>
                <option value="bachiller">Bachiller</option>
                <option value="tecnico">Técnico</option>
                <option value="tecnologo">Tecnólogo</option>
                <option value="profesional">Profesional</option>
                <option value="posgrado">Posgrado</option>
              </select>
            </div>

            {/* Profesión u Oficio (Banco de Hojas de Vida) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Profesión u Oficio
                </label>
                <span className="text-[11px] font-bold text-[#0080FF]">Banco de Hojas de Vida</span>
              </div>
              <input
                type="text"
                value={editProfesion}
                onChange={(e) => setEditProfesion(e.target.value)}
                placeholder="Ej. Enfermera, Abogado, Contador..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-[#0080FF] focus:outline-none"
              />
            </div>

            {/* Territorio */}
            {isUrbano ? (
              <div>
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-1">
                  Barrio (Casco Urbano)
                </label>
                <select
                  value={editBarrioId}
                  onChange={(e) => setEditBarrioId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-[#0080FF] focus:outline-none"
                >
                  <option value="">Selecciona Barrio...</option>
                  {territory.barrios.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre} (Junta {b.junta_directiva_id})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-1">
                  Vereda (Zona Rural)
                </label>
                <select
                  value={editVeredaId}
                  onChange={(e) => setEditVeredaId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-[#0080FF] focus:outline-none"
                >
                  <option value="">Selecciona Vereda...</option>
                  {territory.veredas.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Botones de Guardar / Cancelar */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-2/3 py-3 bg-[#0080FF] hover:bg-[#0070e0] text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> GUARDAR CAMBIOS
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* 
            ========================================================================
            MODO 2: LECTURA DEL EXPEDIENTE (Aristotle Style con Botón WhatsApp)
            ========================================================================
          */
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-slate-800">
            {/* Tarjeta de Introducción con Avatar Gigante Institucional */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
              <div className="w-16 h-16 rounded-2xl bg-[#001E72] text-white flex items-center justify-center font-black text-xl shadow-md border-b-4 border-[#F4BD21] shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Simpatizante Registrado
                </span>
                <h4 className="text-base font-black text-slate-900 truncate">
                  {formattedName}
                </h4>
                <p className="text-xs font-mono font-bold text-slate-600 mt-0.5">
                  Cédula: <strong className="text-slate-900">{voter.documento}</strong>
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  {voter._synced !== false ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#166534] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Base de Datos Nube
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#854d0e] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Clock className="w-3 h-3" /> Guardado en Celular
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sección 1: Información de Contacto Inmediato */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                  Canales de Contacto Directo
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-[11px] font-bold text-[#0080FF] hover:underline flex items-center gap-1"
                >
                  <Pencil className="w-3 h-3" /> Corregir Teléfono
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${voter.telefono}`}
                  className="py-3 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition border border-slate-200 shadow-xs"
                >
                  <Phone className="w-4 h-4 text-[#0080FF]" />
                  <span>Llamar al Móvil</span>
                </a>

                <a
                  href={`https://api.whatsapp.com/send?phone=${telWhatsApp}&text=${messageGeneral}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-3 bg-[#3FBC24]/15 hover:bg-[#3FBC24]/25 active:scale-95 text-[#166534] font-black text-xs rounded-xl flex items-center justify-center gap-2 transition border border-[#3FBC24]/30 shadow-xs"
                >
                  <Send className="w-4 h-4 text-[#3FBC24]" />
                  <span>WhatsApp Campaña</span>
                </a>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 font-sans">Línea Telefónica:</span>
                <strong className="text-slate-900 text-sm">{voter.telefono}</strong>
              </div>
            </div>

            {/* Sección 2: Banco de Hojas de Vida & Perfil Profesional */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                  Banco de Hojas de Vida
                </span>
                <span className="text-[10px] font-black text-[#0080FF] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Oportunidades
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#0080FF]" /> Nivel de Estudios:
                  </span>
                  <span className="font-bold text-slate-900 capitalize px-2 py-0.5 bg-white rounded-md border border-slate-200">
                    {voter.estudio_realizado || 'Bachiller'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-[#0080FF]" /> Profesión u Oficio:
                  </span>
                  <span className="font-black text-[#001E72] px-2 py-0.5 bg-white rounded-md border border-blue-200">
                    {voter.profesion ? formatTitleCase(voter.profesion) : 'No especificada'}
                  </span>
                </div>

                {/* Botón especial para Oportunidad de Empleo */}
                <a
                  href={`https://api.whatsapp.com/send?phone=${telWhatsApp}&text=${messageTrabajo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-[#0080FF] hover:bg-[#0070e0] active:scale-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Briefcase className="w-4 h-4 text-[#F4BD21]" />
                  <span>Contactar por Vacante / Hoja de Vida</span>
                </a>
              </div>
            </div>

            {/* Sección 3: Ubicación y Estructura Territorial */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                Asignación Territorial
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Barrio / Vereda</span>
                  <strong className="text-slate-900 text-sm block mt-0.5 truncate">
                    {voter.barrio_nombre || voter.vereda_nombre || (voter.barrio_id ? `Barrio #${voter.barrio_id}` : 'Turbo')}
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Junta Directiva</span>
                  <strong className="text-[#001E72] text-sm block mt-0.5">
                    {voter.junta_directiva_id ? `Junta #${voter.junta_directiva_id}` : 'Zona Rural'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Sección 4: Trazabilidad y Auditoría */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center justify-between">
                <span>Registrado por:</span>
                <strong className="text-slate-900">{voter.registrador_nombre || 'Equipo Central'}</strong>
              </div>
              {voter.created_at && (
                <div className="flex items-center justify-between">
                  <span>Fecha de Inscripción:</span>
                  <span className="font-mono text-slate-700">
                    {new Date(voter.created_at).toLocaleString('es-CO')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>Zona Electoral:</span>
                <span className="capitalize font-bold text-slate-800">{voter.zona || 'Urbano'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Pie de Acciones del Inspector */}
        {!isEditing && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 py-2.5 bg-[#001E72] hover:bg-[#001655] text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
            >
              <Pencil className="w-3.5 h-3.5 text-[#F4BD21]" />
              <span>Editar Datos / Teléfono</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
