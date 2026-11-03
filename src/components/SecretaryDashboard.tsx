'use client';

import React, { useState, useEffect } from 'react';
import { UsuarioSistema, Votante, Rol } from '../types';
import { supabase } from '../lib/supabase';
import { getCachedTerritory } from '../lib/offline-sync';
import {
  Users,
  UserPlus,
  LogOut,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Shield,
  MapPin,
  ChevronRight
} from 'lucide-react';
import VoterRegistrationModal from './VoterRegistrationModal';

interface Props {
  currentUser: UsuarioSistema;
  onLogout: () => void;
  onVoterAdded: (v: Votante) => void;
}

export default function SecretaryDashboard({ currentUser, onLogout, onVoterAdded }: Props) {
  const [activeTab, setActiveTab] = useState<'lideres' | 'votantes'>('lideres');
  const [leaders, setLeaders] = useState<UsuarioSistema[]>([]);
  const [juntaVoters, setJuntaVoters] = useState<Votante[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [voterModalOpen, setVoterModalOpen] = useState(false);
  const [leaderModalOpen, setLeaderModalOpen] = useState(false);

  // Formulario nuevo líder
  const [newLeaderNombre, setNewLeaderNombre] = useState('');
  const [newLeaderDoc, setNewLeaderDoc] = useState('');
  const [newLeaderTel, setNewLeaderTel] = useState('');
  const [newLeaderPassword, setNewLeaderPassword] = useState('');
  const [newLeaderRol, setNewLeaderRol] = useState<Rol>('lider_equipo_operativo');
  const [newLeaderBarrioId, setNewLeaderBarrioId] = useState<number | ''>('');
  const [savingLeader, setSavingLeader] = useState(false);
  const [createdLeaderSuccess, setCreatedLeaderSuccess] = useState<{
    nombre: string;
    doc: string;
    tel: string;
    pass: string;
  } | null>(null);

  const territory = getCachedTerritory();
  const juntaId = currentUser.junta_directiva_id || 1;
  const currentJunta = territory.juntas.find((j) => j.id === juntaId);
  const availableBarrios = territory.barrios.filter((b) => b.junta_directiva_id === juntaId);

  useEffect(() => {
    if (availableBarrios.length > 0 && !newLeaderBarrioId) {
      setNewLeaderBarrioId(availableBarrios[0].id);
    }
  }, [availableBarrios, newLeaderBarrioId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, votersRes] = await Promise.all([
        fetch(`/api/users?junta_id=${juntaId}`),
        fetch(`/api/voters?junta_id=${juntaId}`),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const filteredLeaders = (usersData as UsuarioSistema[]).filter((u) =>
          ['lider_junta_directiva', 'lider_equipo_operativo', 'lider_barrial'].includes(u.rol)
        );
        setLeaders(filteredLeaders);
      }

      if (votersRes.ok) {
        const votersData = await votersRes.json();
        setJuntaVoters(votersData as Votante[]);
      }
    } catch (err) {
      console.error('Error cargando datos de secretaria', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [juntaId]);

  const handleCreateLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaderNombre.trim() || !newLeaderDoc.trim() || !newLeaderTel.trim()) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setSavingLeader(true);
    const pass = newLeaderPassword.trim() || newLeaderDoc.trim();
    const metaMinima = newLeaderRol === 'lider_equipo_operativo' ? 25 : 15;

    const newLeaderPayload = {
      documento: newLeaderDoc.trim(),
      nombre_completo: newLeaderNombre.trim(),
      telefono: newLeaderTel.trim(),
      correo: `pwd:${pass}`,
      rol: newLeaderRol,
      zona: 'urbano',
      junta_directiva_id: juntaId,
      barrio_id: newLeaderBarrioId ? Number(newLeaderBarrioId) : null,
      lider_inmediato_id: currentUser.id,
      meta_minima: metaMinima,
      is_active: true,
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeaderPayload),
      });

      const result = await res.json();
      setSavingLeader(false);

      if (!res.ok) {
        alert(result.error || 'Error al registrar líder.');
      } else {
        const created = result as UsuarioSistema;
        setLeaders([created, ...leaders]);
        setCreatedLeaderSuccess({
          nombre: created.nombre_completo,
          doc: created.documento,
          tel: created.telefono,
          pass: pass,
        });
        setNewLeaderNombre('');
        setNewLeaderDoc('');
        setNewLeaderTel('');
        setNewLeaderPassword('');
      }
    } catch (err: any) {
      setSavingLeader(false);
      alert('Error de red al guardar: ' + (err.message || 'Intenta de nuevo'));
    }
  };

  const getWhatsAppLink = (tel: string, nombre: string, doc: string, pass: string) => {
    const cleanTel = tel.replace(/\D/g, '');
    const telWithCode = cleanTel.startsWith('57') ? cleanTel : `57${cleanTel}`;
    const text = `Hola ${nombre}, has sido asignado(a) como líder en el ${currentJunta?.nombre || `Equipo Operativo ${juntaId}`} para la Campaña de Janier Lloreda (SOMOS TURBO).

Tus credenciales de acceso para registrar a tus votantes son:
👤 Usuario (Cédula): ${doc}
🔑 Contraseña: ${pass}

Ingresa aquí:
${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}`;

    return `https://api.whatsapp.com/send?phone=${telWithCode}&text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Cinta Tricolor Bandera de Turbo */}
      <div className="w-full h-1.5 flex">
        <div className="h-full w-1/3 bg-[#F4BD21]" />
        <div className="h-full w-1/3 bg-[#3FBC24]" />
        <div className="h-full w-1/3 bg-[#0080FF]" />
      </div>

      {/* Header Superior con Identidad Institucional Janier Lloreda */}
      <header className="bg-[#001E72] text-white px-4 py-3 sticky top-0 z-20 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white px-3 py-1.5 rounded-2xl shadow-sm flex items-center gap-2">
            <img src="/logo-janier.png" alt="Janier Lloreda Valencia" className="h-10 sm:h-11 w-auto object-contain" />
            <div className="h-7 w-px bg-slate-200 hidden sm:block" />
            <img src="/logo-somos.png" alt="SOMOS Turbo" className="h-7 w-auto object-contain hidden sm:block" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">
                {currentJunta?.nombre || `Equipo Operativo ${juntaId}`}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#F4BD21] text-[#001E72] uppercase">
                Secretaría
              </span>
            </div>
            <h2 className="text-sm font-black text-white truncate max-w-[200px]">
              {currentUser.nombre_completo}
            </h2>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="px-3 py-1.5 text-xs font-bold text-white rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center gap-1.5 shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
        {/* Identidad del Territorio de la Junta */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/60 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">
                Tu Territorio Asignado
              </span>
              <h3 className="text-2xl font-black text-slate-900">{currentJunta?.nombre || `Equipo Operativo ${juntaId}`}</h3>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-[#0080FF]">{juntaVoters.length}</span>
              <span className="text-xs text-slate-500 block font-bold">Votantes en tu Equipo</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
              Barrios que integran este Equipo Operativo:
            </span>
            <div className="flex flex-wrap gap-2">
              {availableBarrios.map((b) => (
                <span
                  key={b.id}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-[#0080FF] border border-blue-200 shadow-sm"
                >
                  {b.nombre}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Botón Central: "Ingresar Nuevo Líder a este Equipo" */}
        <button
          onClick={() => {
            setCreatedLeaderSuccess(null);
            setLeaderModalOpen(true);
          }}
          className="w-full py-4 px-5 rounded-2xl bg-[#0080FF] hover:bg-[#006ec7] text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-lg border-b-2 border-[#F4BD21] active:scale-[0.99] transition"
        >
          <UserPlus className="w-5 h-5 stroke-[2.5]" />
          <span>INGRESAR NUEVO LÍDER A ESTE EQUIPO</span>
        </button>

        {/* Pestañas: Líderes / Votantes */}
        <div className="flex border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('lideres')}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              activeTab === 'lideres'
                ? 'border-[#0080FF] text-[#0080FF]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Líderes de mi Equipo ({leaders.length})
          </button>
          <button
            onClick={() => setActiveTab('votantes')}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              activeTab === 'votantes'
                ? 'border-[#0080FF] text-[#0080FF]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Votantes Registrados ({juntaVoters.length})
          </button>
        </div>

        {/* Pestaña Líderes */}
        {activeTab === 'lideres' ? (
          <div className="space-y-3">
            {leaders.length === 0 ? (
              <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-3xl space-y-1">
                <p className="text-slate-600 text-xs font-bold">
                  Aún no has registrado líderes para tu equipo operativo.
                </p>
                <p className="text-[11px] text-slate-400">
                  Pulsa el botón azul de arriba para agregar a los líderes de tus barrios y mandarles sus datos por WhatsApp.
                </p>
              </div>
            ) : (
              leaders.map((l) => {
                const votosLider = juntaVoters.filter((v) => v.registrado_por === l.id).length;
                const meta = l.meta_minima || 25;
                const pct = Math.min(100, Math.round((votosLider / meta) * 100));
                const barrioObj = availableBarrios.find((b) => b.id === l.barrio_id);

                return (
                  <div
                    key={l.id}
                    className="p-4 rounded-2xl bg-white border border-slate-100 shadow-md shadow-slate-100 space-y-2 hover:border-[#0080FF]/30 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{l.nombre_completo}</h4>
                        <p className="text-xs text-slate-500 font-medium">
                          CC: <strong className="text-slate-800">{l.documento}</strong> • Tel: {l.telefono}
                        </p>
                        <p className="text-xs text-[#0080FF] font-bold mt-0.5">
                          {barrioObj ? `Barrio: ${barrioObj.nombre}` : 'Equipo Operativo'}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-black border ${
                          votosLider >= meta
                            ? 'bg-emerald-50 text-[#3FBC24] border-emerald-200'
                            : pct >= 50
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}
                      >
                        {votosLider} / {meta} Votos
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          votosLider >= meta ? 'bg-[#3FBC24]' : pct >= 50 ? 'bg-[#F4BD21]' : 'bg-red-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setVoterModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0080FF] text-xs font-bold border border-blue-200 flex items-center gap-1.5 transition"
              >
                <UserPlus className="w-4 h-4" /> Registrar Votante Directo
              </button>
            </div>

            {juntaVoters.length === 0 ? (
              <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
                <p className="text-xs text-slate-500 font-bold">Tus líderes aún no han registrado votantes en este equipo operativo.</p>
              </div>
            ) : (
              juntaVoters.map((v) => (
                <div key={v.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 block">{v.nombre_completo}</span>
                    <span className="text-slate-500 text-xs">CC {v.documento} • Tel: {v.telefono}</span>
                  </div>
                  <span className="text-xs font-bold text-[#0080FF] bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                    {v.barrio_nombre || 'Barrio Equipo'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Modal Ingresar Nuevo Líder */}
      {leaderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            {createdLeaderSuccess ? (
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#3FBC24] flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">¡Líder Asignado con Éxito!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Envíale sus datos de acceso para que empiece a meter votantes:
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 font-mono">
                  <p><span className="text-slate-500">Líder:</span> <strong className="text-slate-900">{createdLeaderSuccess.nombre}</strong></p>
                  <p><span className="text-slate-500">Cédula:</span> <strong className="text-[#0080FF]">{createdLeaderSuccess.doc}</strong></p>
                  <p><span className="text-slate-500">Contraseña:</span> <strong className="text-amber-800">{createdLeaderSuccess.pass}</strong></p>
                </div>

                <div className="pt-2 space-y-2">
                  <a
                    href={getWhatsAppLink(
                      createdLeaderSuccess.tel,
                      createdLeaderSuccess.nombre,
                      createdLeaderSuccess.doc,
                      createdLeaderSuccess.pass
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 bg-[#3FBC24] hover:bg-[#349e1e] text-white shadow-lg shadow-emerald-500/20 transition"
                  >
                    <Send className="w-4 h-4" /> Enviar Credenciales por WhatsApp
                  </a>
                  <button
                    onClick={() => {
                      setCreatedLeaderSuccess(null);
                      setLeaderModalOpen(false);
                    }}
                    className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-bold"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Ingresar Líder a tu Equipo</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Asigna un líder para {currentJunta?.nombre || `Equipo ${juntaId}`}.
                  </p>
                </div>

                <form onSubmit={handleCreateLeader} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={newLeaderNombre}
                      onChange={(e) => setNewLeaderNombre(e.target.value)}
                      placeholder="Ej. Andrés Mosquera"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs font-semibold focus:bg-white focus:border-[#0080FF] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Cédula (Usuario para entrar) *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={newLeaderDoc}
                      onChange={(e) => setNewLeaderDoc(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej. 1017123456"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs font-semibold focus:bg-white focus:border-[#0080FF] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Teléfono Celular (WhatsApp) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newLeaderTel}
                      onChange={(e) => setNewLeaderTel(e.target.value)}
                      placeholder="300 000 0000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs font-semibold focus:bg-white focus:border-[#0080FF] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Barrio Asignado de este Equipo
                    </label>
                    <select
                      value={newLeaderBarrioId}
                      onChange={(e) => setNewLeaderBarrioId(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs font-semibold focus:bg-white focus:border-[#0080FF] focus:outline-none"
                    >
                      {availableBarrios.map((b) => (
                        <option key={b.id} value={b.id}>{b.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Contraseña Asignada (Opcional, por defecto su Cédula)
                    </label>
                    <input
                      type="text"
                      value={newLeaderPassword}
                      onChange={(e) => setNewLeaderPassword(e.target.value)}
                      placeholder="Si lo dejas vacío, su contraseña será su cédula"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs font-semibold focus:bg-white focus:border-[#0080FF] focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setLeaderModalOpen(false)}
                      className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingLeader}
                      className="w-1/2 py-3 bg-[#0080FF] hover:bg-[#0070e0] text-white font-black text-xs rounded-xl transition shadow-md shadow-[#0080FF]/25"
                    >
                      {savingLeader ? 'Guardando...' : 'Crear Líder'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Registrar Votante */}
      <VoterRegistrationModal
        currentUser={currentUser}
        isOpen={voterModalOpen}
        onClose={() => setVoterModalOpen(false)}
        onVoterAdded={(newV) => {
          setJuntaVoters([newV, ...juntaVoters]);
          onVoterAdded(newV);
        }}
      />
    </div>
  );
}
