'use client';

import React, { useState, useEffect } from 'react';
import { UsuarioSistema, Votante, Rol } from '../types';
import { supabase } from '../lib/supabase';
import { getCachedTerritory } from '../lib/offline-sync';
import * as XLSX from 'xlsx';
import {
  Flame,
  Award,
  Users,
  Download,
  Activity,
  LogOut,
  MapPin,
  TrendingUp,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Send,
  Lock,
  Phone,
  ShieldCheck,
  UserCheck,
  UserX,
  Sliders,
  BarChart3
} from 'lucide-react';
import VoterRegistrationModal from './VoterRegistrationModal';

interface Props {
  currentUser: UsuarioSistema;
  allVoters: Votante[];
  onLogout: () => void;
  onVoterAdded: (v: Votante) => void;
}

export default function WarRoomDashboard({ currentUser, allVoters, onLogout, onVoterAdded }: Props) {
  const [activeTab, setActiveTab] = useState<'resumen' | 'equipos' | 'usuarios' | 'censo'>('resumen');
  const [systemUsers, setSystemUsers] = useState<UsuarioSistema[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');

  // Modales
  const [voterModalOpen, setVoterModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);

  // Formulario nuevo usuario
  const [newNombre, setNewNombre] = useState('');
  const [newDoc, setNewDoc] = useState('');
  const [newTel, setNewTel] = useState('');
  const [newRol, setNewRol] = useState<Rol>('secretaria');
  const [newJuntaId, setNewJuntaId] = useState<number>(1);
  const [newPassword, setNewPassword] = useState('');
  const [savingUser, setSavingUser] = useState(false);
  const [createdUserSuccess, setCreatedUserSuccess] = useState<{
    nombre: string;
    doc: string;
    tel: string;
    pass: string;
    rol: string;
  } | null>(null);

  // Meta de Victoria para Janier Lloreda en Turbo (Cifra Mágica)
  const metaMagica = 20000;
  const territory = getCachedTerritory();

  // Vista del Tablero de los 11 Equipos (Gráfico o Tarjetas)
  const [viewMode, setViewMode] = useState<'grafico' | 'tarjetas'>('grafico');
  // Filtro de la Gráfica Central de Barrios (Estilo Aristotle)
  const [chartFilter, setChartFilter] = useState<'top_barrios' | 'reforzar' | 'equipos'>('top_barrios');
  // Vista del Censo (Tabla o Tarjetas estilo Aristotle)
  const [voterViewMode, setVoterViewMode] = useState<'tabla' | 'tarjetas'>('tabla');

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setSystemUsers(data as UsuarioSistema[]);
      }
    } catch (err) {
      console.error('Error cargando usuarios', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllUsers();
  }, []);

  // Métricas
  const totalVotos = allVoters.length;
  const porcentajeVictoria = Math.min(100, Math.round((totalVotos / metaMagica) * 100));
  const votosUrbanos = allVoters.filter((v) => v.zona === 'urbano').length;
  const votosRurales = allVoters.filter((v) => v.zona === 'rural').length;

  // Estadísticas de los 11 Equipos Operativos
  const equiposStats = territory.juntas.map((j: any) => {
    const votos = allVoters.filter((v) => v.junta_directiva_id === j.id).length;
    const lideresCount = systemUsers.filter((u) => u.junta_directiva_id === j.id).length;
    const metaJunta = 1200;
    const pct = Math.min(100, Math.round((votos / metaJunta) * 100));
    return {
      ...j,
      votos,
      lideresCount,
      metaJunta,
      pct,
      status: pct >= 80 ? 'verde' : pct >= 40 ? 'amarillo' : 'rojo',
    };
  });

  // Estadísticas detalladas de los 40 Barrios de Turbo (Recuperación Territorial)
  const barrioStats = (territory.barrios || []).map((b: any) => {
    const votos = allVoters.filter((v) => v.barrio_id === b.id || v.barrio_nombre === b.nombre).length;
    const junta = territory.juntas.find((j: any) => j.id === b.junta_directiva_id);
    return {
      ...b,
      votos,
      juntaNombre: junta?.nombre || 'Equipo Operativo',
    };
  });

  // Top barrios con más votantes (Fuerza)
  const topBarrios = [...barrioStats].sort((a: any, b: any) => b.votos - a.votos);

  // Barrios por reforzar (los que tienen menor votación)
  const barriosPorReforzar = [...barrioStats].sort((a: any, b: any) => a.votos - b.votos);

  // Barrio líder actual
  const barrioLider = topBarrios[0] || { nombre: 'En proceso de censo', votos: 0 };

  // Cantidad de barrios que ya tienen votantes
  const barriosConVotos = barrioStats.filter((b: any) => b.votos > 0).length;

  // Datos para la gráfica central según el filtro seleccionado
  const chartItems = chartFilter === 'top_barrios'
    ? topBarrios.slice(0, 8)
    : chartFilter === 'reforzar'
    ? barriosPorReforzar.slice(0, 8)
    : equiposStats.map((eq: any) => ({ nombre: eq.nombre, votos: eq.votos, id: eq.id }));

  const chartMaxVal = Math.max(
    ...chartItems.map((item: any) => item.votos || 0),
    chartFilter === 'equipos' ? 1200 : 25
  );

  const handleCreateSystemUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim() || !newDoc.trim() || !newTel.trim()) {
      alert('Completa los campos obligatorios');
      return;
    }

    setSavingUser(true);
    const pass = newPassword.trim() || newDoc.trim();

    const payload = {
      documento: newDoc.trim(),
      nombre_completo: newNombre.trim(),
      telefono: newTel.trim(),
      correo: `pwd:${pass}`,
      rol: newRol,
      zona: 'urbano',
      junta_directiva_id: newRol === 'secretaria' ? Number(newJuntaId) : null,
      lider_inmediato_id: currentUser.id,
      meta_minima: newRol === 'secretaria' ? 500 : 1000,
      is_active: true,
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      setSavingUser(false);

      if (!res.ok) {
        alert(result.error || 'Error creando usuario en el sistema.');
      } else {
        const created = result as UsuarioSistema;
        setSystemUsers([created, ...systemUsers]);
        setCreatedUserSuccess({
          nombre: created.nombre_completo,
          doc: created.documento,
          tel: created.telefono,
          pass: pass,
          rol: created.rol.replace(/_/g, ' '),
        });
        setNewNombre('');
        setNewDoc('');
        setNewTel('');
        setNewPassword('');
      }
    } catch (err: any) {
      setSavingUser(false);
      alert('Error de red al crear usuario: ' + (err.message || 'Intenta de nuevo'));
    }
  };

  const toggleUserStatus = async (user: UsuarioSistema) => {
    const newStatus = !user.is_active;
    const confirmMsg = newStatus
      ? `¿Deseas activar a ${user.nombre_completo}?`
      : `¿Deseas dar de baja a ${user.nombre_completo}? No podrá ingresar al software.`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, is_active: newStatus }),
      });

      if (!res.ok) {
        const result = await res.json();
        alert('Error actualizando estado: ' + (result.error || 'Intenta de nuevo'));
      } else {
        setSystemUsers(systemUsers.map((u) => (u.id === user.id ? { ...u, is_active: newStatus } : u)));
      }
    } catch (err: any) {
      alert('Error de red: ' + err.message);
    }
  };

  const getWhatsAppLink = (tel: string, nombre: string, doc: string, pass: string, rolName: string) => {
    const cleanTel = tel.replace(/\D/g, '');
    const telWithCode = cleanTel.startsWith('57') ? cleanTel : `57${cleanTel}`;
    const text = `Hola ${nombre}, te damos la bienvenida a la plataforma oficial de la Campaña de Janier Lloreda (SOMOS TURBO).

Tus credenciales de acceso para tu rol de ${rolName} son:
👤 Usuario (Cédula): ${doc}
🔑 Contraseña: ${pass}

Ingresa aquí:
${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}`;

    return `https://api.whatsapp.com/send?phone=${telWithCode}&text=${encodeURIComponent(text)}`;
  };

  const exportToExcel = () => {
    const exportData = allVoters.map((v, idx) => ({
      '#': idx + 1,
      'Cédula': v.documento,
      'Nombre Completo': v.nombre_completo,
      'Teléfono': v.telefono,
      'Nivel Estudio': v.estudio_realizado,
      'Zona': v.zona,
      'Barrio / Vereda': v.barrio_nombre || v.vereda_nombre || 'N/A',
      'Equipo Operativo': v.junta_directiva_id ? `Equipo #${v.junta_directiva_id}` : 'Rural',
      'Fecha Registro': v.created_at ? new Date(v.created_at).toLocaleString() : 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Censo_Janier_Lloreda');
    XLSX.writeFile(workbook, `Censo_Electoral_Janier_Lloreda_Turbo_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 font-sans">
      {/* Cinta Tricolor Bandera de Turbo */}
      <div className="w-full h-1.5 flex">
        <div className="h-full w-1/3 bg-[#F4BD21]" />
        <div className="h-full w-1/3 bg-[#3FBC24]" />
        <div className="h-full w-1/3 bg-[#0080FF]" />
      </div>

      {/* Barra Superior de Alerta / Contexto */}
      <div className="bg-[#001E72] text-white px-3 sm:px-4 py-1.5 text-xs border-b border-white/10">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full text-[10px] sm:text-[11px]">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#3FBC24] animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-[#00CFFF]">SISTEMA ELECTORAL</span>
            <span className="hidden sm:inline text-slate-300">• Turbo 2026</span>
          </div>
          <div className="text-slate-300">
            <span className="hidden sm:inline">Comando: </span>
            <strong className="text-white font-bold">{currentUser.nombre_completo}</strong>
          </div>
        </div>
      </div>

      {/* Header Institucional Responsive Adaptado a Móvil y Desktop */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Branding Oficial */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 border border-slate-200/80 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl shadow-xs">
              <img
                src="/logo-janier.png"
                alt="Janier Lloreda Valencia"
                className="h-8 sm:h-12 w-auto object-contain"
              />
              <div className="h-6 sm:h-8 w-px bg-slate-300 hidden sm:block" />
              <img
                src="/logo-somos.png"
                alt="SOMOS Nuevas Acciones"
                className="h-6 sm:h-9 w-auto object-contain hidden sm:block"
              />
            </div>
            <div className="hidden lg:block pl-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#001E72] bg-[#F4BD21] px-2 py-0.5 rounded">
                  TURBO 2026
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#3FBC24]">
                  SALA DE COMANDO
                </span>
              </div>
              <span className="text-xs font-black text-slate-800 tracking-tight block">
                Control Territorial • 11 Equipos
              </span>
            </div>
          </div>

          {/* Botones de Acción: En Desktop completos, en Móvil compactos */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Botón Desktop 1: Alta Usuario (Amarillo Turbo #F4BD21) */}
            <button
              onClick={() => {
                setCreatedUserSuccess(null);
                setUserModalOpen(true);
              }}
              className="hidden sm:flex px-3.5 py-2 bg-[#F4BD21] hover:bg-[#e0ac1a] text-[#001E72] rounded-xl text-xs font-black uppercase tracking-wider items-center gap-1.5 shadow-xs transition active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-[#001E72]" />
              <span>Crear Usuario</span>
            </button>

            {/* Botón Desktop 2: Nuevo Votante (Verde Turbo #3FBC24) */}
            <button
              onClick={() => setVoterModalOpen(true)}
              className="hidden sm:flex px-3.5 py-2 bg-[#3FBC24] hover:bg-[#349e1e] text-white rounded-xl text-xs font-black uppercase tracking-wider items-center gap-1.5 shadow-xs transition active:scale-95"
            >
              <UserCheck className="w-4 h-4" />
              <span>Nuevo Votante</span>
            </button>

            {/* Botón Excel */}
            <button
              onClick={exportToExcel}
              className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-slate-200"
              title="Descargar censo en Excel"
            >
              <Download className="w-4 h-4 text-[#001E72]" />
              <span className="hidden md:inline">Excel</span>
            </button>

            {/* Botón Salir */}
            <button
              onClick={onLogout}
              className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition border border-red-200"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5 space-y-4 sm:space-y-5">
        
        {/* BOTONERA MÓVIL PRINCIPAL (Para que la secretaria cree usuarios y registre votantes de inmediato) */}
        <div className="sm:hidden grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => {
              setCreatedUserSuccess(null);
              setUserModalOpen(true);
            }}
            className="w-full py-2.5 px-3 bg-[#F4BD21] active:bg-[#e0ac1a] text-[#001E72] rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
          >
            <UserPlus className="w-4 h-4 text-[#001E72]" />
            <span>Crear Usuario</span>
          </button>

          <button
            onClick={() => setVoterModalOpen(true)}
            className="w-full py-2.5 px-3 bg-[#3FBC24] active:bg-[#349e1e] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
          >
            <UserCheck className="w-4 h-4" />
            <span>Nuevo Votante</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* ENCABEZADO Y FILA SUPERIOR: MÉTRICAS COMPACTAS 2x2 EN MÓVIL, 4 EN DESKTOP  */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          {/* Título institucional en español */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                Sala de Mando Territorial
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Panel de Control Electoral • Distrito de Turbo 2026
              </p>
            </div>
            
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Meta Territorial:</span>
              <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                {totalVotos.toLocaleString()} / 20.000 Votos ({porcentajeVictoria}%)
              </span>
            </div>
          </div>

          {/* GRID 2x2 EN MÓVIL, 4 COLUMNAS EN DESKTOP: PULIDO Y COMPACTO */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 items-stretch">
            
            {/* Tarjeta 1: Verde Institucional #3FBC24 (Censo Territorial) */}
            <div className="bg-[#f5fbf5] border border-[#3FBC24]/40 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-700 block">
                  Censo Registrado
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  {totalVotos.toLocaleString()}
                </div>
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#2f961a] font-bold pt-1.5 truncate">
                {votosUrbanos} urb. • {votosRurales} rur.
              </div>
            </div>

            {/* Tarjeta 2: Amarillo Institucional #F4BD21 (Barrio Líder) */}
            <div className="bg-[#fefef2] border border-[#F4BD21]/50 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-700 block">
                  Barrio Líder
                </span>
                <div className="text-xs sm:text-lg font-bold text-slate-900 mt-0.5 truncate" title={barrioLider.nombre}>
                  {barrioLider.nombre}
                </div>
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#997300] font-bold pt-1.5 truncate">
                {barrioLider.votos} simpatizantes
              </div>
            </div>

            {/* Tarjeta 3: Azul Oscuro Institucional #001E72 (Barrios por Reforzar) */}
            <div className="bg-[#f8fafc] border border-[#001E72]/30 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-700 block">
                  Por Reforzar
                </span>
                <div className="text-xl sm:text-2xl font-black text-[#001E72] mt-0.5">
                  {40 - barriosConVotos} <span className="text-xs font-normal text-slate-500">/ 40</span>
                </div>
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#001E72] font-semibold pt-1.5 truncate">
                {barriosConVotos} con presencia activa
              </div>
            </div>

            {/* Tarjeta 4: Usuario Activo y Rol */}
            <div className="bg-white border border-[#00CFFF]/40 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 block truncate max-w-[95px] sm:max-w-[130px]">
                    {currentUser.nombre_completo}
                  </span>
                  <span className="text-[10px] text-slate-500 capitalize block truncate">
                    {currentUser.rol.replace(/_/g, ' ')}
                  </span>
                </div>
                <button
                  onClick={() => setUserModalOpen(true)}
                  className="px-2 py-0.5 bg-[#F4BD21] hover:bg-[#e0ac1a] text-[#001E72] text-[10px] sm:text-[11px] font-black rounded shadow-xs transition shrink-0"
                >
                  Admin
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium pt-1.5 border-t border-slate-100">
                <span>{systemUsers.length} mandos</span>
                <span className="text-[#3FBC24] font-bold">● En línea</span>
              </div>
            </div>

          </div>
        </div>

        {/* Pestañas de Navegación con Scroll Horizontal Suave en Móvil */}
        <div className="flex border-b border-slate-200 text-xs font-bold text-slate-500 gap-4 sm:gap-6 overflow-x-auto whitespace-nowrap pb-1">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`pb-2 transition border-b-2 shrink-0 ${
              activeTab === 'resumen'
                ? 'border-[#0080FF] text-[#0080FF]'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            Análisis de Barrios y Equipos
          </button>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`pb-2 transition border-b-2 shrink-0 ${
              activeTab === 'usuarios'
                ? 'border-[#0080FF] text-[#0080FF]'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            Estructura de Usuarios ({systemUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('censo')}
            className={`pb-2 transition border-b-2 shrink-0 ${
              activeTab === 'censo'
                ? 'border-[#0080FF] text-[#0080FF]'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            Censo de Votantes ({allVoters.length})
          </button>
        </div>

        {/* TAB 1: GRÁFICO CENTRAL Y COLUMNA LATERAL EXACTAMENTE COMO ARISTOTLE */}
        {activeTab === 'resumen' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            
            {/* ================================================================= */}
            {/* COLUMNA CENTRAL (8/12): GRÁFICA ELEGANTE CON LÍNEAS FINAS        */}
            {/* ================================================================= */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              
              {/* Header del Gráfico con Título y Filtros Compactos */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {chartFilter === 'top_barrios'
                      ? 'Barrios con Mayor Cantidad de Votantes'
                      : chartFilter === 'reforzar'
                      ? 'Barrios Críticos por Reforzar'
                      : 'Comparativa de los 11 Equipos Operativos'}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Cifras consolidadas del censo en tiempo real
                  </span>
                </div>

                {/* Filtros estilo pestañitas sutiles */}
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
                  <button
                    onClick={() => setChartFilter('top_barrios')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      chartFilter === 'top_barrios'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Más Votantes
                  </button>
                  <button
                    onClick={() => setChartFilter('reforzar')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      chartFilter === 'reforzar'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Por Reforzar
                  </button>
                  <button
                    onClick={() => setChartFilter('equipos')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      chartFilter === 'equipos'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    11 Equipos
                  </button>
                </div>
              </div>

              {/* Área del Gráfico con Barras Finas y Escala Estilo Aristotle */}
              <div className="pt-2">
                <div className="h-56 sm:h-64 w-full flex items-end justify-between gap-3 sm:gap-6 relative border-b border-slate-200 px-3">
                  
                  {/* Líneas horizontales de guía ultra-sutiles estilo Aristotle */}
                  <div className="absolute inset-x-0 top-1/4 border-b border-slate-100 pointer-events-none" />
                  <div className="absolute inset-x-0 top-2/4 border-b border-slate-100 pointer-events-none" />
                  <div className="absolute inset-x-0 top-3/4 border-b border-slate-100 pointer-events-none" />

                  {/* Barras Elegantes con ancho controlado */}
                  {chartItems.map((item: any, idx: number) => {
                    const barPercent = Math.min(100, Math.max(6, Math.round(((item.votos || 0) / chartMaxVal) * 100)));
                    const isHigh = chartFilter === 'top_barrios' && idx < 2;
                    const isWarning = chartFilter === 'reforzar' && (item.votos || 0) === 0;

                    return (
                      <div
                        key={item.id || idx}
                        className="flex-1 flex flex-col items-center h-full justify-end group relative max-w-[48px]"
                      >
                        {/* Número sobre la barra */}
                        <div className="mb-1.5 transition">
                          <span className="text-[11px] font-semibold text-slate-700">
                            {item.votos || 0}
                          </span>
                        </div>

                        {/* La Barra Pulida y Fina con Paleta Oficial (Verde éxito, Amarillo alerta, Azul Somos) */}
                        <div
                          className={`w-full max-w-[28px] sm:max-w-[32px] rounded-t-sm transition-all duration-300 ${
                            isWarning
                              ? 'bg-[#F4BD21]'
                              : isHigh
                              ? 'bg-[#3FBC24]'
                              : 'bg-[#0080FF]'
                          }`}
                          style={{ height: `${barPercent}%` }}
                        />

                        {/* Etiqueta del Eje X limpia */}
                        <div className="mt-2 text-center w-full">
                          <span 
                            className="text-[10px] sm:text-[11px] font-medium text-slate-700 block truncate"
                            title={item.nombre}
                          >
                            {item.nombre.replace('Equipo Operativo ', 'Eq ')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Leyenda al pie con Paleta Oficial */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Total sectores analizados: {chartItems.length}</span>
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#3FBC24]" /> Destacados
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#0080FF]" /> Censo Activo
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#F4BD21]" /> Por Reforzar
                  </span>
                </span>
              </div>
            </div>

            {/* ================================================================= */}
            {/* COLUMNA LATERAL (4/12): LISTA DETALLADA ESTILO ARISTOTLE          */}
            {/* ================================================================= */}
            <div className="lg:col-span-4 space-y-3">
              
              {/* Caja 1: Top Barrios con Más Votantes (Verde #3FBC24) */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800">
                    Barrios Más Fuertes
                  </span>
                  <span className="text-[10px] font-bold text-[#2f961a] bg-[#3FBC24]/10 px-2 py-0.5 rounded border border-[#3FBC24]/30">
                    Mayor Censo
                  </span>
                </div>

                <div className="space-y-2">
                  {topBarrios.slice(0, 4).map((b: any, index: number) => (
                    <div key={b.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Mini cuadro con Verde #3FBC24 */}
                        <div className="w-7 h-7 rounded bg-[#3FBC24]/10 border border-[#3FBC24]/30 flex items-center justify-center font-bold text-xs text-[#2f961a] shrink-0">
                          {index + 1}
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-medium text-slate-800 block truncate">
                            {b.nombre}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {b.juntaNombre}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#001E72] font-mono shrink-0">
                        {b.votos} Votos
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Caja 2: Barrios por Reforzar (Amarillo #F4BD21 y Azul Oscuro #001E72) */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800">
                    Barrios por Reforzar
                  </span>
                  <span className="text-[10px] font-bold text-[#997300] bg-[#F4BD21]/15 px-2 py-0.5 rounded border border-[#F4BD21]/30">
                    Atención
                  </span>
                </div>

                <div className="space-y-1.5">
                  {barriosPorReforzar.slice(0, 4).map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between py-1 px-2 rounded-lg text-xs">
                      <span className="text-slate-600 truncate max-w-[160px] font-medium">
                        {b.nombre}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        b.votos === 0
                          ? 'bg-[#F4BD21]/15 text-[#997300] border border-[#F4BD21]/30'
                          : 'bg-slate-100 text-[#001E72]'
                      }`}>
                        {b.votos} Votos
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: Estructura y Administración de Usuarios (Solo Janier Lloreda) */}
        {activeTab === 'usuarios' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Consola Maestra de Usuarios de Campaña
                </h3>
                <p className="text-xs text-slate-500">
                  Crea usuarios, asigna contraseñas y envía credenciales por WhatsApp con un solo clic.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none"
                >
                  <option value="todos">Todos los Roles</option>
                  <option value="coordinador">Coordinadores</option>
                  <option value="secretaria_general">Secretaria General</option>
                  <option value="secretaria">Secretarias de Equipo</option>
                  <option value="lider_junta_directiva">Líderes de Equipo</option>
                  <option value="lider_barrial">Líderes Barriales</option>
                  <option value="lider_veredal">Líderes Veredales</option>
                </select>

                <button
                  onClick={() => {
                    setCreatedUserSuccess(null);
                    setUserModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#F4BD21] hover:bg-[#e0ac1a] text-[#001E72] rounded-xl text-xs font-black uppercase flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Crear Usuario</span>
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Nombre / Cédula</th>
                      <th className="p-3.5">Rol en Campaña</th>
                      <th className="p-3.5">Ámbito Asignado</th>
                      <th className="p-3.5">Teléfono (WhatsApp)</th>
                      <th className="p-3.5 text-center">Votos</th>
                      <th className="p-3.5 text-center">Estado</th>
                      <th className="p-3.5 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {systemUsers
                      .filter((u) => roleFilter === 'todos' || u.rol === roleFilter)
                      .map((u) => {
                        const count = allVoters.filter((v) => v.registrado_por === u.id).length;
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3.5">
                              <strong className="text-slate-900 block font-bold">{u.nombre_completo}</strong>
                              <span className="text-slate-500 text-[11px] font-mono">CC: {u.documento}</span>
                            </td>
                            <td className="p-3.5 font-bold text-[#0080FF] capitalize">
                              {u.rol.replace(/_/g, ' ')}
                            </td>
                            <td className="p-3.5 text-slate-600 font-medium">
                              {u.junta_directiva_id ? `Equipo Operativo #${u.junta_directiva_id}` : u.zona}
                            </td>
                            <td className="p-3.5 text-slate-800 font-mono font-semibold">{u.telefono}</td>
                            <td className="p-3.5 text-center">
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 font-black text-slate-800 border border-slate-200">
                                {count}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              {u.is_active ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2f961a] bg-[#3FBC24]/10 px-2.5 py-0.5 rounded-full border border-[#3FBC24]/30">
                                  <UserCheck className="w-3 h-3" /> Activo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                                  <UserX className="w-3 h-3" /> Inactivo
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <a
                                  href={getWhatsAppLink(
                                    u.telefono,
                                    u.nombre_completo,
                                    u.documento,
                                    u.correo ? (u.correo.startsWith('pwd:') ? u.correo.replace('pwd:', '') : u.documento) : u.documento,
                                    u.rol.replace(/_/g, ' ')
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-[#3FBC24]/15 hover:bg-[#3FBC24]/25 text-[#2f961a] rounded-lg transition"
                                  title="Enviar datos por WhatsApp"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </a>
                                {u.id !== currentUser.id && (
                                  <button
                                    onClick={() => toggleUserStatus(u)}
                                    className={`p-1.5 rounded-lg text-xs font-bold transition ${
                                      u.is_active
                                        ? 'bg-red-50 hover:bg-red-100 text-red-600'
                                        : 'bg-[#3FBC24]/10 hover:bg-[#3FBC24]/20 text-[#2f961a]'
                                    }`}
                                    title={u.is_active ? 'Dar de baja' : 'Reactivar'}
                                  >
                                    {u.is_active ? 'Baja' : 'Alta'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Censo General de Votantes (Estilo Aristotle con Tabla y Tarjetas de Contacto) */}
        {activeTab === 'censo' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Censo Electoral de Simpatizantes
                </h3>
                <p className="text-xs text-slate-500">
                  Total de {allVoters.length} simpatizantes registrados en Turbo.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Selector Vista: Tabla vs Tarjetas */}
                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    onClick={() => setVoterViewMode('tabla')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      voterViewMode === 'tabla'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Tabla
                  </button>
                  <button
                    onClick={() => setVoterViewMode('tarjetas')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      voterViewMode === 'tarjetas'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Fichas Móviles
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar cédula o nombre..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0080FF]"
                  />
                </div>
              </div>
            </div>

            {/* VISTA 1: TABLA CLÁSICA */}
            {voterViewMode === 'tabla' && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Cédula</th>
                        <th className="p-3.5">Nombre Completo</th>
                        <th className="p-3.5">Teléfono</th>
                        <th className="p-3.5">Barrio / Vereda</th>
                        <th className="p-3.5">Estudios</th>
                        <th className="p-3.5">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {allVoters
                        .filter(
                          (v) =>
                            v.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            v.documento.includes(searchTerm)
                        )
                        .map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3.5 font-mono font-bold text-slate-900">{v.documento}</td>
                            <td className="p-3.5 font-bold text-slate-900">{v.nombre_completo}</td>
                            <td className="p-3.5 text-slate-800 font-mono">{v.telefono}</td>
                            <td className="p-3.5 text-slate-600">
                              {v.barrio_nombre || v.vereda_nombre || 'Turbo'}
                            </td>
                            <td className="p-3.5 capitalize text-slate-600">{v.estudio_realizado}</td>
                            <td className="p-3.5">
                              {v._synced !== false ? (
                                <span className="text-[10px] text-[#2f961a] bg-[#3FBC24]/10 px-2 py-0.5 rounded-full border border-[#3FBC24]/30 font-bold">
                                  Sincronizado
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#9a7407] bg-[#F4BD21]/15 px-2 py-0.5 rounded-full border border-[#F4BD21]/40 font-bold">
                                  En Celular
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VISTA 2: FICHAS MÓVILES (Estilo Aristotle Phone Card) */}
            {voterViewMode === 'tarjetas' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allVoters
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
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-[#001E72] text-white flex items-center justify-center font-black text-sm shadow-md shrink-0 border-b-2 border-[#F4BD21]">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{v.nombre_completo}</h4>
                            <p className="text-xs text-slate-500 font-mono">CC: {v.documento}</p>
                            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              📍 {v.barrio_nombre || v.vereda_nombre || 'Turbo'}
                            </span>
                          </div>
                        </div>

                        {/* Botones de Contacto Rápido (Llamar y WhatsApp) */}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                          <a
                            href={`tel:${v.telefono}`}
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#0080FF]" />
                            <span>Llamar</span>
                          </a>
                          <a
                            href={`https://api.whatsapp.com/send?phone=${telWhatsApp}&text=${encodeURIComponent(
                              `Hola ${v.nombre_completo}, te saludamos de la campaña de Janier Lloreda (SOMOS TURBO).`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 px-3 rounded-xl bg-[#3FBC24]/15 hover:bg-[#3FBC24]/25 text-[#2f961a] font-bold text-xs flex items-center justify-center gap-1.5 transition"
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
          </div>
        )}
      </main>

      {/* Modal Crear Usuario (Control Total de Janier Lloreda) */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            {createdUserSuccess ? (
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-[#3FBC24]/10 text-[#2f961a] flex items-center justify-center mx-auto border border-[#3FBC24]/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">¡Usuario Dado de Alta!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Envíale sus credenciales de acceso directamente a su WhatsApp:
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 font-mono">
                  <p><span className="text-slate-500">Nombre:</span> <strong className="text-slate-900 font-bold">{createdUserSuccess.nombre}</strong></p>
                  <p><span className="text-slate-500">Rol:</span> <strong className="text-[#0080FF] capitalize font-bold">{createdUserSuccess.rol}</strong></p>
                  <p><span className="text-slate-500">Usuario (CC):</span> <strong className="text-slate-900 font-bold">{createdUserSuccess.doc}</strong></p>
                  <p><span className="text-slate-500">Contraseña:</span> <strong className="text-[#E11D48] font-bold">{createdUserSuccess.pass}</strong></p>
                </div>

                <div className="pt-2 space-y-2">
                  <a
                    href={getWhatsAppLink(
                      createdUserSuccess.tel,
                      createdUserSuccess.nombre,
                      createdUserSuccess.doc,
                      createdUserSuccess.pass,
                      createdUserSuccess.rol
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 bg-[#3FBC24] hover:bg-[#349e1e] text-white shadow-lg transition"
                  >
                    <Send className="w-4 h-4" /> Enviar Credenciales por WhatsApp
                  </a>
                  <button
                    onClick={() => {
                      setCreatedUserSuccess(null);
                      setUserModalOpen(false);
                    }}
                    className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    Cerrar Consola
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase">Dar de Alta Usuario</h3>
                    <p className="text-xs text-slate-500">
                      Asigna secretarias, coordinadores o líderes oficiales.
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0080FF]/10 text-[#0080FF]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>

                <form onSubmit={handleCreateSystemUser} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={newNombre}
                      onChange={(e) => setNewNombre(e.target.value)}
                      placeholder="Ej. Carmen Palacios"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-base font-semibold focus:border-[#0080FF] focus:ring-2 focus:ring-[#0080FF]/20 focus:outline-none focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Cédula (Usuario para ingresar) *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={newDoc}
                      onChange={(e) => setNewDoc(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej. 1017894561"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-base font-semibold focus:border-[#0080FF] focus:ring-2 focus:ring-[#0080FF]/20 focus:outline-none focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Teléfono Celular (Para enviar WhatsApp) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newTel}
                      onChange={(e) => setNewTel(e.target.value)}
                      placeholder="300 000 0000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-base font-semibold focus:border-[#0080FF] focus:ring-2 focus:ring-[#0080FF]/20 focus:outline-none focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Rol Asignado
                    </label>
                    <select
                      value={newRol}
                      onChange={(e) => setNewRol(e.target.value as Rol)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-sm font-semibold focus:border-[#0080FF] focus:outline-none focus:bg-white transition"
                    >
                      <option value="secretaria">Secretaria de Equipo Operativo</option>
                      <option value="coordinador">Coordinador General</option>
                      <option value="secretaria_general">Secretaria General</option>
                      <option value="lider_junta_directiva">Líder de Equipo Operativo</option>
                      <option value="gerente_general">Gerente General (Admin)</option>
                    </select>
                  </div>

                  {['secretaria', 'lider_junta_directiva'].includes(newRol) && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Equipo Operativo Asignado
                      </label>
                      <select
                        value={newJuntaId}
                        onChange={(e) => setNewJuntaId(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-sm font-semibold focus:border-[#0080FF] focus:outline-none focus:bg-white transition"
                      >
                        {territory.juntas.map((j: any) => (
                          <option key={j.id} value={j.id}>{j.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Contraseña Asignada (Opcional, por defecto su Cédula)
                    </label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Por defecto su número de cédula"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-base font-semibold focus:border-[#0080FF] focus:ring-2 focus:ring-[#0080FF]/20 focus:outline-none focus:bg-white transition"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setUserModalOpen(false)}
                      className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingUser}
                      className="w-1/2 py-3 bg-[#F4BD21] hover:bg-[#e0ac1a] text-[#001E72] font-black text-xs uppercase tracking-wider rounded-2xl transition shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {savingUser ? 'Guardando...' : 'Crear Usuario'}
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
        onVoterAdded={onVoterAdded}
      />

      {/* 
        Barra de Navegación Inferior Móvil para la Sala de Mando (Estilo Aristotle)
        Permite al administrador o Janier alternar entre Territorio, Mandos y Censo con el pulgar
      */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-3 flex items-center justify-around z-30 shadow-lg select-none">
        <button
          onClick={() => setActiveTab('resumen')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition active:scale-95 ${
            activeTab === 'resumen' ? 'text-[#0080FF] font-black' : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <BarChart3 className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[10px]">Territorio</span>
        </button>

        <button
          onClick={() => setActiveTab('usuarios')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition active:scale-95 relative ${
            activeTab === 'usuarios' ? 'text-[#0080FF] font-black' : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <Users className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[10px]">Mandos</span>
          {systemUsers.length > 0 && (
            <span className="absolute top-0 right-1 bg-[#F4BD21] text-[#001E72] text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
              {systemUsers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('censo')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition active:scale-95 relative ${
            activeTab === 'censo' ? 'text-[#0080FF] font-black' : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <UserCheck className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[10px]">Censo</span>
          {allVoters.length > 0 && (
            <span className="absolute top-0 right-1 bg-[#3FBC24] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
              {allVoters.length}
            </span>
          )}
        </button>
      </nav>
    </div>
  );
}
