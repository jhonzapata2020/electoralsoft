'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  User,
  GraduationCap,
  Briefcase,
  MapPin,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Votante, NivelEstudio } from '../types';
import { formatTitleCase } from '../lib/formatters';
import { getCachedTerritory, updateVoter } from '../lib/offline-sync';

interface Props {
  voter: Votante | null;
  isOpen: boolean;
  onClose: () => void;
  onVoterUpdated: (updated: Votante) => void;
}

export default function EditVoterModal({ voter, isOpen, onClose, onVoterUpdated }: Props) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [estudio, setEstudio] = useState<NivelEstudio>('bachiller');
  const [profesion, setProfesion] = useState('');
  const [barrioId, setBarrioId] = useState<number | ''>('');
  const [veredaId, setVeredaId] = useState<number | ''>('');
  const [correo, setCorreo] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const territory = getCachedTerritory();

  useEffect(() => {
    if (voter) {
      setNombre(voter.nombre_completo || '');
      setTelefono(voter.telefono || '');
      setEstudio((voter.estudio_realizado as NivelEstudio) || 'bachiller');
      setProfesion(voter.profesion || '');
      setBarrioId(voter.barrio_id || '');
      setVeredaId(voter.vereda_id || '');
      setCorreo(voter.correo || '');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [voter, isOpen]);

  if (!isOpen || !voter) return null;

  const isUrbano = voter.zona === 'urbano';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefono.trim() || !nombre.trim()) {
      setErrorMsg('El nombre y el número de teléfono celular son obligatorios.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const selectedBarrio = territory.barrios.find((b) => b.id === Number(barrioId));
    const selectedVereda = territory.veredas.find((v) => v.id === Number(veredaId));

    const result = await updateVoter({
      id: voter.id,
      documento: voter.documento,
      nombre_completo: formatTitleCase(nombre),
      telefono: telefono.trim(),
      estudio_realizado: estudio,
      profesion: profesion.trim() ? formatTitleCase(profesion) : null,
      correo: correo.trim() || null,
      barrio_id: isUrbano ? Number(barrioId) || null : null,
      vereda_id: !isUrbano ? Number(veredaId) || null : null,
      junta_directiva_id: isUrbano ? selectedBarrio?.junta_directiva_id || voter.junta_directiva_id : null,
      barrio_nombre: selectedBarrio?.nombre,
      vereda_nombre: selectedVereda?.nombre,
    });

    setSaving(false);

    if (result.success && result.voter) {
      setSuccessMsg('¡Campos y perfil actualizados con éxito en la base de datos!');
      onVoterUpdated(result.voter);
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setErrorMsg(result.error || 'Error al actualizar el registro en la base de datos.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
        {/* Cabecera del Modal */}
        <div className="bg-[#001E72] px-6 py-4 text-white flex items-center justify-between border-b border-white/10">
          <div>
            <span className="text-[10px] font-black tracking-widest text-[#F4BD21] uppercase block">
              PANEL DE CONTROL ADMIN • EDITAR REGISTRO
            </span>
            <h3 className="text-base font-black truncate text-white">
              Editar Campos del Votante
            </h3>
            <p className="text-xs text-blue-200 font-mono mt-0.5">
              Cédula: <strong>{voter.documento}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-[#166534] text-xs font-bold flex items-center gap-2.5 animate-fade-in shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-[#3FBC24] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-red-700 text-xs font-bold flex items-center gap-2.5 animate-fade-in shadow-xs">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* CAMPO DESTACADO: NÚMERO DE TELÉFONO */}
          <div className="p-4 rounded-2xl bg-blue-50/80 border-2 border-[#0080FF] space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-[#001E72] tracking-wider flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-[#0080FF]" />
                <span>Número de Teléfono Celular *</span>
              </label>
              <span className="text-[10px] font-black text-[#166534] bg-emerald-100 px-2 py-0.5 rounded-full">
                Línea WhatsApp
              </span>
            </div>
            <input
              type="tel"
              required
              autoFocus
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej. 320 710 5318"
              className="w-full bg-white border border-blue-300 rounded-xl px-4 py-3 text-lg font-mono font-black text-slate-950 focus:border-[#0080FF] focus:ring-4 focus:ring-[#0080FF]/20 focus:outline-none transition"
            />
            <p className="text-[11px] text-slate-600 font-medium">
              💡 Digita aquí el nuevo número. Se actualizará de inmediato para llamadas y envíos de WhatsApp.
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
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-[#0080FF] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Nivel de Estudio */}
            <div>
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-1">
                Nivel de Estudios
              </label>
              <select
                value={estudio}
                onChange={(e) => setEstudio(e.target.value as NivelEstudio)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0080FF] focus:outline-none"
              >
                <option value="primaria">Primaria</option>
                <option value="bachiller">Bachiller</option>
                <option value="tecnico">Técnico</option>
                <option value="tecnologo">Tecnólogo</option>
                <option value="profesional">Profesional</option>
                <option value="posgrado">Posgrado</option>
              </select>
            </div>

            {/* Profesión u Oficio */}
            <div>
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-1">
                Profesión u Oficio
              </label>
              <input
                type="text"
                value={profesion}
                onChange={(e) => setProfesion(e.target.value)}
                placeholder="Ej. Enfermera, Abogado..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0080FF] focus:outline-none"
              />
            </div>
          </div>

          {/* Barrio o Vereda */}
          {isUrbano ? (
            <div>
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-1">
                Barrio (Turbo Urbano)
              </label>
              <select
                value={barrioId}
                onChange={(e) => setBarrioId(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0080FF] focus:outline-none"
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
                value={veredaId}
                onChange={(e) => setVeredaId(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0080FF] focus:outline-none"
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

          {/* Botones de Acción */}
          <div className="pt-3 flex gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-2/3 py-3 bg-[#0080FF] hover:bg-[#0070e0] text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-[#0080FF]/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
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
      </div>
    </div>
  );
}
