'use client';

import React from 'react';
import { X, Phone, Send, MapPin, Briefcase, GraduationCap, CheckCircle2, Clock, User, Calendar, Shield, Share2 } from 'lucide-react';
import { Votante } from '../types';
import { formatTitleCase } from '../lib/formatters';

interface Props {
  voter: Votante | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactInspectorDrawer({ voter, isOpen, onClose }: Props) {
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      {/* Backdrop clicable para cerrar */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel Lateral (Estilo Aristotle Contacts Inspector) */}
      <div className="relative w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 z-10 overflow-hidden animate-slide-left">
        
        {/* Cabecera Teal / Azul Aristóteles con Nombre y Acciones */}
        <div className="bg-[#001E72] px-5 py-4 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-black tracking-widest text-[#F4BD21] uppercase block">
              EXPEDIENTE DE CONTACTO • ARISTÓTELES
            </span>
            <h3 className="text-base font-black truncate text-white">
              {formattedName}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con Scroll Suave */}
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
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
              Canales de Contacto Directo
            </span>
            
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

        {/* Pie de Acciones del Inspector */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200 transition"
          >
            Cerrar Ficha
          </button>
        </div>

      </div>
    </div>
  );
}
