'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  BarChart3,
  Printer,
  RefreshCw,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Pencil
} from 'lucide-react';
import VoterFilterSidebar, {
  VoterFilterState,
  initialFilterState,
  countActiveFilters
} from './VoterFilterSidebar';
import VoterRegistrationModal from './VoterRegistrationModal';
import ReportPdfModal from './ReportPdfModal';
import ContactInspectorDrawer from './ContactInspectorDrawer';
import EditVoterModal from './EditVoterModal';
import { formatTitleCase } from '../lib/formatters';

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
  const [estudioFilter, setEstudioFilter] = useState<string>('todos');

  // Datos en vivo sincronizados con la base de datos
  const [liveVoters, setLiveVoters] = useState<Votante[]>(allVoters);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modales
  const [voterModalOpen, setVoterModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [editingVoter, setEditingVoter] = useState<Votante | null>(null);

  // Inspector Lateral de Simpatizante (Estilo Aristotle CRUD)
  const [selectedVoter, setSelectedVoter] = useState<Votante | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [voterViewMode, setVoterViewMode] = useState<'tabla' | 'tarjetas'>('tabla');

  // Filtros Avanzados y Paginación Estilo Aristóteles Campaign Manager
  const [filters, setFilters] = useState<VoterFilterState>(initialFilterState);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Profesiones detectadas en tiempo real para autocompletado y banco de hojas de vida
  const availableProfessions = useMemo<[string, number][]>(() => {
    const map: Record<string, number> = {};
    liveVoters.forEach((v) => {
      if (v.profesion && v.profesion.trim()) {
        const clean = formatTitleCase(v.profesion.trim());
        map[clean] = (map[clean] || 0) + 1;
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [liveVoters]);

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
  const [chartFilter, setChartFilter] = useState<'juntas' | 'equipos' | 'top_barrios' | 'reforzar'>('juntas');
  // Vista del Censo (Tabla o Tarjetas estilo Aristotle)


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

  const fetchLiveVoters = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/voters');
      if (res.ok) {
        const data = await res.json();
        setLiveVoters(data as Votante[]);
      }
    } catch (err) {
      console.warn('Error sincronizando censo en vivo', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllUsers();
    fetchLiveVoters();
    const interval = setInterval(fetchLiveVoters, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (allVoters && allVoters.length > 0) {
      setLiveVoters((prev) => {
        const map = new Map<string, Votante>();
        prev.forEach((v) => map.set(v.documento, v));
        allVoters.forEach((v) => map.set(v.documento, v));
        return Array.from(map.values());
      });
    }
  }, [allVoters]);

  const handleInternalVoterAdded = (v: Votante) => {
    setLiveVoters((prev) => [v, ...prev.filter((item) => item.documento !== v.documento)]);
    onVoterAdded(v);
  };

  // Métricas en tiempo real con datos de base de datos
  const totalVotos = liveVoters.length;
  const porcentajeVictoria = Math.min(100, Math.round((totalVotos / metaMagica) * 100));
  const votosUrbanos = liveVoters.filter((v) => v.zona === 'urbano').length;
  const votosRurales = liveVoters.filter((v) => v.zona === 'rural').length;

  // Estadísticas de las 20 Juntas Directivas
  const equiposStats = territory.juntas.map((j: any) => {
    const votos = liveVoters.filter((v) => Number(v.junta_directiva_id) === Number(j.id)).length;
    const lideresCount = systemUsers.filter((u) => Number(u.junta_directiva_id) === Number(j.id)).length;
    const metaJunta = 1000;
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
    const votos = liveVoters.filter(
      (v) =>
        Number(v.barrio_id) === Number(b.id) ||
        (v.barrio_nombre && v.barrio_nombre.toLowerCase() === b.nombre.toLowerCase())
    ).length;
    const junta = territory.juntas.find((j: any) => Number(j.id) === Number(b.junta_directiva_id));
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

  // Barrio líder actual (si no hay votos aún, mostrar aviso limpio)
  const barrioLider = topBarrios.length > 0 && topBarrios[0].votos > 0
    ? topBarrios[0]
    : { nombre: 'En proceso de censo', votos: 0 };

  // Cantidad de barrios que ya tienen votantes reales
  const barriosConVotos = barrioStats.filter((b: any) => b.votos > 0).length;

  // Datos para la gráfica central según el filtro seleccionado
  const chartItems = chartFilter === 'top_barrios'
    ? topBarrios.slice(0, 10)
    : chartFilter === 'reforzar'
    ? barriosPorReforzar.slice(0, 10)
    : chartFilter === 'equipos'
    ? barrioStats.slice(0, 20).map((b: any) => ({ nombre: b.nombre, votos: b.votos, id: b.id }))
    : equiposStats.map((eq: any) => ({ nombre: eq.nombre.replace('Junta Directiva ', 'JD '), votos: eq.votos, id: eq.id }));

  const chartMaxVal = Math.max(
    ...chartItems.map((item: any) => item.votos || 0),
    chartFilter === 'juntas' ? 1000 : 25
  );

  const handleCreateSystemUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim() || !newDoc.trim() || !newTel.trim()) {
      alert('Completa los campos obligatorios');
      return;
    }

    // BLINDAJE: Solo el Gerente General (Janier) puede crear otro Gerente General
    if (newRol === 'gerente_general' && currentUser.rol !== 'gerente_general') {
      alert('Permiso denegado: Solo el Gerente General puede asignar este rol de máxima autoridad.');
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
      junta_directiva_id: ['secretaria', 'lider_junta_directiva', 'lider_equipo_operativo'].includes(newRol) ? Number(newJuntaId) : null,
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
    const text = `Hola ${nombre}, te damos la bienvenida a la plataforma oficial de la Campaña de Janier Lloreda (SOMOS NUEVAS ACCIONES).

Tus credenciales de acceso para tu rol de ${rolName} son:
👤 Usuario (Cédula): ${doc}
🔑 Contraseña: ${pass}

Ingresa aquí:
${typeof window !== 'undefined' ? window.location.origin : 'https://electoralsoft.vercel.app'}`;

    return `https://api.whatsapp.com/send?phone=${telWithCode}&text=${encodeURIComponent(text)}`;
  };

  const exportToExcel = () => {
    const exportData = liveVoters.map((v, idx) => ({
      '#': idx + 1,
      'Cédula': v.documento,
      'Nombre Completo': formatTitleCase(v.nombre_completo),
      'Teléfono': v.telefono,
      'Nivel Estudio': v.estudio_realizado,
      'Profesión / Oficio': v.profesion ? formatTitleCase(v.profesion) : 'N/A',
      'Zona': v.zona,
      'Barrio / Vereda': v.barrio_nombre || v.vereda_nombre || (v.barrio_id ? `Barrio ${v.barrio_id}` : 'N/A'),
      'Junta Directiva': v.junta_directiva_id ? `Junta #${v.junta_directiva_id}` : 'Rural',
      'Fecha Registro': v.created_at ? new Date(v.created_at).toLocaleString('es-CO') : 'N/A',
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

            {/* Botón Reporte PDF */}
            <button
              onClick={() => setPdfModalOpen(true)}
              className="p-2 sm:px-3 sm:py-2 bg-blue-50 hover:bg-blue-100 text-[#001E72] rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-blue-200 shadow-xs active:scale-95"
              title="Ver Reporte Oficial en PDF / Imprimir"
            >
              <Printer className="w-4 h-4 text-[#0080FF]" />
              <span className="hidden md:inline">Reporte PDF</span>
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
        <div className="sm:hidden space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
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

          {/* Botón Móvil: Ver Reporte Oficial en PDF */}
          <button
            onClick={() => setPdfModalOpen(true)}
            className="w-full py-2 px-3 bg-white border border-[#0080FF]/30 hover:bg-blue-50 text-[#001E72] rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs active:scale-95 transition"
          >
            <Printer className="w-4 h-4 text-[#0080FF]" />
            <span>Ver Reporte Oficial en PDF (Voltear Celular)</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* ENCABEZADO Y FILA SUPERIOR: MÉTRICAS ESTILO ARISTÓTELES (FULL-WIDTH EN MÓVIL) */}
        {/* ========================================================================= */}
        <div className="space-y-3.5">
          {/* Saludo Ejecutivo estilo Aristóteles con Botón En Vivo */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                ¡Hola, {currentUser.nombre_completo.split(' ')[0]}! 👋
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Sala de Mando y Control Electoral • Distrito de Turbo 2026
              </p>
            </div>
            
            <button
              onClick={fetchLiveVoters}
              disabled={isRefreshing}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition border border-slate-200 shadow-xs shrink-0"
              title="Sincronizar datos en vivo de la base de datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#0080FF] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-xs font-bold text-slate-800">{isRefreshing ? 'Actualizando...' : 'En Vivo'}</span>
              <span className="w-2 h-2 rounded-full bg-[#3FBC24] animate-pulse" />
            </button>
          </div>

          {/* TARJETAS ESTILO ARISTÓTELES: 1 COLUMNA EN MÓVIL (ESPACIOSAS Y LEGIBLES), 4 EN COMPUTADOR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
            
            {/* Tarjeta 1: Censo Registrado (Celeste Aristóteles #E0F2FE con borde #38BDF8) */}
            <div className="bg-[#E0F2FE] border-2 border-[#38BDF8] rounded-2xl p-4 shadow-sm flex flex-col justify-between transition hover:shadow-md">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-[#0369A1] tracking-wider uppercase">
                    Censo Registrado
                  </span>
                  <span className="text-[10px] font-black bg-[#0284C7] text-white px-2 py-0.5 rounded-md shadow-xs">
                    META 20.000
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
                  {totalVotos.toLocaleString()}{' '}
                  <span className="text-xs font-bold text-[#0369A1]">
                    simpatizantes ({porcentajeVictoria}%)
                  </span>
                </div>
              </div>
              <div className="text-xs text-[#0369A1] font-bold pt-2 border-t border-[#38BDF8]/40 mt-2.5 flex items-center justify-between">
                <span>Urbana: <strong>{votosUrbanos}</strong></span>
                <span>•</span>
                <span>Corregimientos: <strong>{votosRurales}</strong></span>
              </div>
            </div>

            {/* Tarjeta 2: Barrio Líder (Durazno / Peach Aristóteles #FFEDD5 con borde #FB923C) */}
            <div className="bg-[#FFEDD5] border-2 border-[#FB923C] rounded-2xl p-4 shadow-sm flex flex-col justify-between transition hover:shadow-md">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-[#9A3412] tracking-wider uppercase">
                    Barrio Líder
                  </span>
                  <span className="text-[10px] font-black bg-[#EA580C] text-white px-2 py-0.5 rounded-md shadow-xs">
                    FUERZA #1
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-950 mt-1 truncate" title={barrioLider.nombre}>
                  {barrioLider.nombre}
                </div>
              </div>
              <div className="text-xs text-[#9A3412] font-bold pt-2 border-t border-[#FB923C]/40 mt-2.5">
                {barrioLider.votos} simpatizantes confirmados
              </div>
            </div>

            {/* Tarjeta 3: Cobertura de Barrios (Amarillo Oro Aristóteles #FEF9C3 con borde #FACC15) */}
            <div className="bg-[#FEF9C3] border-2 border-[#EAB308] rounded-2xl p-4 shadow-sm flex flex-col justify-between transition hover:shadow-md">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-[#854D0E] tracking-wider uppercase">
                    Cobertura de Barrios
                  </span>
                  <span className="text-[10px] font-black bg-[#CA8A04] text-white px-2 py-0.5 rounded-md shadow-xs">
                    40 BARRIOS
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
                  {barriosConVotos}{' '}
                  <span className="text-xs font-bold text-[#854D0E]">
                    con presencia de 40
                  </span>
                </div>
              </div>
              <div className="text-xs text-[#854D0E] font-bold pt-2 border-t border-[#EAB308]/40 mt-2.5 flex items-center justify-between">
                <span>Por reforzar: <strong className="text-slate-950 font-black">{40 - barriosConVotos} barrios</strong></span>
                <span className="text-[11px] text-[#A16207]">Turbo Urbano</span>
              </div>
            </div>

            {/* Tarjeta 4: Comando Activo & Estructura (Verde Menta Aristóteles #DCFCE7 con borde #4ADE80) */}
            <div className="bg-[#DCFCE7] border-2 border-[#4ADE80] rounded-2xl p-4 shadow-sm flex flex-col justify-between transition hover:shadow-md">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-[#166534] tracking-wider uppercase">
                    Comando Activo
                  </span>
                  <button
                    onClick={() => setUserModalOpen(true)}
                    className="px-2.5 py-0.5 bg-[#F4BD21] hover:bg-[#e0ac1a] text-[#001E72] text-[11px] font-black rounded-lg shadow-xs transition"
                  >
                    Admin
                  </button>
                </div>
                <div className="text-lg sm:text-xl font-black text-slate-950 mt-1 truncate">
                  {currentUser.nombre_completo}
                </div>
                <div className="text-xs text-[#166534] font-bold capitalize">
                  {currentUser.rol.replace(/_/g, ' ')}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#166534] font-bold pt-2 border-t border-[#4ADE80]/40 mt-2.5">
                <span><strong>{systemUsers.length}</strong> mandos en estructura</span>
                <span className="text-[#15803D] font-black flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span> En línea
                </span>
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
            <div className="lg:col-span-8 min-w-0 max-w-full bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm space-y-3.5 overflow-hidden">
              
              {/* Header del Gráfico con Título y Filtros Compactos */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {chartFilter === 'juntas'
                      ? 'Comparativa de las 20 Juntas Directivas'
                      : chartFilter === 'equipos'
                      ? 'Comparativa de los 40 Equipos Operativos (Barrios)'
                      : chartFilter === 'top_barrios'
                      ? 'Barrios con Mayor Cantidad de Votantes'
                      : 'Barrios Críticos por Reforzar'}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Cifras consolidadas del censo en tiempo real
                  </span>
                </div>

                {/* Filtros estilo pestañitas sutiles con scroll horizontal en móvil */}
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs overflow-x-auto max-w-full">
                  <button
                    onClick={() => setChartFilter('juntas')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition shrink-0 ${
                      chartFilter === 'juntas'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    20 Juntas
                  </button>
                  <button
                    onClick={() => setChartFilter('equipos')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition shrink-0 ${
                      chartFilter === 'equipos'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    40 Equipos
                  </button>
                  <button
                    onClick={() => setChartFilter('top_barrios')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition shrink-0 ${
                      chartFilter === 'top_barrios'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Más Votantes
                  </button>
                  <button
                    onClick={() => setChartFilter('reforzar')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition shrink-0 ${
                      chartFilter === 'reforzar'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Por Reforzar
                  </button>
                </div>
              </div>

              {/* Área del Gráfico con Barras Finas y Escala Estilo Aristotle (Ajuste Perfecto en Desktop y Touch en Móvil) */}
              <div className="pt-2 w-full min-w-0 overflow-hidden">
                {/* Indicador táctil en celular para que sepan que pueden deslizar suavemente */}
                <div className="flex sm:hidden items-center justify-between text-[11px] text-slate-500 font-semibold mb-2 px-1 bg-slate-50 border border-slate-200/60 rounded-lg py-1">
                  <span className="flex items-center gap-1.5 text-[#0080FF]">
                    <span className="text-xs">↔</span> Desliza con el dedo para ver las {chartItems.length} {chartFilter === 'juntas' ? 'Juntas' : 'Equipos'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">1-{chartItems.length}</span>
                </div>

                {/* Contenedor deslizable suave en pantallas pequeñas y full responsive en PC */}
                <div className="w-full max-w-full overflow-x-auto pb-3 pt-1 scrollbar-thin touch-pan-x">
                  <div
                    className="h-56 sm:h-64 flex items-end justify-between relative border-b border-slate-200 px-1 sm:px-2 w-full min-w-[560px] lg:min-w-0"
                  >
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
                          className="flex flex-col items-center h-full justify-end group relative flex-1 min-w-[20px] max-w-[32px] mx-auto"
                        >
                          {/* Número sobre la barra */}
                          <div className="mb-1 transition">
                            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 font-mono">
                              {item.votos || 0}
                            </span>
                          </div>

                          {/* La Barra Pulida y Fina con Paleta Oficial (Verde éxito, Amarillo alerta, Azul Somos) */}
                          <div
                            className={`w-3.5 sm:w-5 rounded-t-sm transition-all duration-300 shadow-2xs ${
                              isWarning
                                ? 'bg-[#F4BD21]'
                                : isHigh
                                ? 'bg-[#3FBC24]'
                                : 'bg-[#0080FF]'
                            }`}
                            style={{ height: `${barPercent}%` }}
                          />

                          {/* Etiqueta del Eje X limpia sin montarse */}
                          <div className="mt-2 text-center w-full px-0.5">
                            <span 
                              className="text-[9px] sm:text-[10px] font-bold text-slate-600 block truncate"
                              title={item.nombre}
                            >
                              {item.nombre.replace('Junta Directiva ', 'JD ').replace('Equipo Operativo ', 'Eq ')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Leyenda al pie con Paleta Oficial organizada y responsive */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-700">Total sectores: {chartItems.length}</span>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#3FBC24]" /> Destacados
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#0080FF]" /> Censo Activo
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#F4BD21]" /> Por Reforzar
                  </span>
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* COLUMNA LATERAL (4/12): LISTA DETALLADA ESTILO ARISTOTLE          */}
            {/* ================================================================= */}
            <div className="lg:col-span-4 min-w-0 max-w-full space-y-3">
              
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

        {/* TAB 3: Censo General de Votantes y Banco de Hojas de Vida (Estilo Aristóteles con Sidebar de Filtros) */}
        {activeTab === 'censo' && (() => {
          const profCount = liveVoters.filter((v) => v.estudio_realizado === 'profesional' || v.estudio_realizado === 'posgrado').length;
          const tecnCount = liveVoters.filter((v) => v.estudio_realizado === 'tecnico' || v.estudio_realizado === 'tecnologo').length;
          const activeFiltersCount = countActiveFilters(filters);

          const filteredVoters = liveVoters.filter((v) => {
            // 1. Buscador global (search)
            if (filters.search.trim()) {
              const q = filters.search.toLowerCase().trim();
              const matchName = v.nombre_completo.toLowerCase().includes(q);
              const matchDoc = v.documento.includes(q);
              const matchProf = v.profesion ? v.profesion.toLowerCase().includes(q) : false;
              const matchBarrio = v.barrio_nombre ? v.barrio_nombre.toLowerCase().includes(q) : false;
              const matchVereda = v.vereda_nombre ? v.vereda_nombre.toLowerCase().includes(q) : false;
              if (!matchName && !matchDoc && !matchProf && !matchBarrio && !matchVereda) return false;
            }

            // 2. Estudio
            if (filters.estudio !== 'todos') {
              if (filters.estudio === 'profesional') {
                if (v.estudio_realizado !== 'profesional' && v.estudio_realizado !== 'posgrado') return false;
              } else if (filters.estudio === 'tecnico') {
                if (v.estudio_realizado !== 'tecnico' && v.estudio_realizado !== 'tecnologo') return false;
              } else if (filters.estudio === 'bachiller') {
                if (v.estudio_realizado !== 'bachiller') return false;
              } else if (filters.estudio === 'primaria') {
                if (v.estudio_realizado !== 'primaria') return false;
              }
            }

            // 3. Profesión
            if (filters.profesion.trim()) {
              const profQ = filters.profesion.toLowerCase().trim();
              if (!v.profesion || !v.profesion.toLowerCase().includes(profQ)) return false;
            }

            // 4. Zona
            if (filters.zona !== 'todas') {
              if (v.zona !== filters.zona) return false;
            }

            // 5. Junta Directiva (1 a 20)
            if (filters.juntaId !== 'todas') {
              if (String(v.junta_directiva_id) !== String(filters.juntaId)) return false;
            }

            // 6. Barrio
            if (filters.barrioId !== 'todos') {
              if (String(v.barrio_id) !== String(filters.barrioId)) return false;
            }

            // 7. Corregimiento (a través de vereda)
            if (filters.corregimientoId !== 'todos') {
              const vereda = territory.veredas.find((ver: any) => String(ver.id) === String(v.vereda_id));
              if (!vereda || String(vereda.corregimiento_id) !== String(filters.corregimientoId)) return false;
            }

            // 8. Vereda
            if (filters.veredaId !== 'todas') {
              if (String(v.vereda_id) !== String(filters.veredaId)) return false;
            }

            // 9. Líder Registrador
            if (filters.liderId !== 'todos') {
              if (v.registrado_por !== filters.liderId) return false;
            }

            // 10. Teléfono
            if (filters.telefono === 'con') {
              if (!v.telefono || v.telefono.replace(/\D/g, '').length < 7) return false;
            } else if (filters.telefono === 'sin') {
              if (v.telefono && v.telefono.replace(/\D/g, '').length >= 7) return false;
            }

            return true;
          });

          // Paginación
          const totalMatches = filteredVoters.length;
          const totalPages = Math.max(1, Math.ceil(totalMatches / pageSize));
          const safeCurrentPage = Math.min(currentPage, totalPages);
          const startIndex = (safeCurrentPage - 1) * pageSize;
          const endIndex = Math.min(startIndex + pageSize, totalMatches);
          const paginatedVoters = filteredVoters.slice(startIndex, endIndex);

          // Pastillas de Filtros Activos con opción de quitar uno a uno
          const activeFilterPills: { key: string; label: string; onClear: () => void }[] = [];
          if (filters.search.trim()) {
            activeFilterPills.push({
              key: 'search',
              label: `Texto: "${filters.search}"`,
              onClear: () => { setFilters((f) => ({ ...f, search: '' })); setCurrentPage(1); }
            });
          }
          if (filters.profesion.trim()) {
            activeFilterPills.push({
              key: 'profesion',
              label: `Profesión: ${formatTitleCase(filters.profesion)}`,
              onClear: () => { setFilters((f) => ({ ...f, profesion: '' })); setCurrentPage(1); }
            });
          }
          if (filters.estudio !== 'todos') {
            activeFilterPills.push({
              key: 'estudio',
              label: `Estudio: ${filters.estudio}`,
              onClear: () => { setFilters((f) => ({ ...f, estudio: 'todos' })); setCurrentPage(1); }
            });
          }
          if (filters.zona !== 'todas') {
            activeFilterPills.push({
              key: 'zona',
              label: `Zona: ${filters.zona}`,
              onClear: () => { setFilters((f) => ({ ...f, zona: 'todas' })); setCurrentPage(1); }
            });
          }
          if (filters.juntaId !== 'todas') {
            activeFilterPills.push({
              key: 'juntaId',
              label: `Junta Directiva ${filters.juntaId}`,
              onClear: () => { setFilters((f) => ({ ...f, juntaId: 'todas' })); setCurrentPage(1); }
            });
          }
          if (filters.barrioId !== 'todos') {
            const b = territory.barrios.find((x: any) => String(x.id) === String(filters.barrioId));
            activeFilterPills.push({
              key: 'barrioId',
              label: `Barrio: ${b?.nombre || filters.barrioId}`,
              onClear: () => { setFilters((f) => ({ ...f, barrioId: 'todos' })); setCurrentPage(1); }
            });
          }
          if (filters.corregimientoId !== 'todos') {
            const c = territory.corregimientos.find((x: any) => String(x.id) === String(filters.corregimientoId));
            activeFilterPills.push({
              key: 'corregimientoId',
              label: `Corregimiento: ${c?.nombre || filters.corregimientoId}`,
              onClear: () => { setFilters((f) => ({ ...f, corregimientoId: 'todos' })); setCurrentPage(1); }
            });
          }
          if (filters.veredaId !== 'todas') {
            const v = territory.veredas.find((x: any) => String(x.id) === String(filters.veredaId));
            activeFilterPills.push({
              key: 'veredaId',
              label: `Vereda: ${v?.nombre || filters.veredaId}`,
              onClear: () => { setFilters((f) => ({ ...f, veredaId: 'todas' })); setCurrentPage(1); }
            });
          }
          if (filters.liderId !== 'todos') {
            const l = systemUsers.find((x: any) => x.id === filters.liderId);
            activeFilterPills.push({
              key: 'liderId',
              label: `Líder: ${l?.nombre_completo || filters.liderId}`,
              onClear: () => { setFilters((f) => ({ ...f, liderId: 'todos' })); setCurrentPage(1); }
            });
          }
          if (filters.telefono !== 'todos') {
            activeFilterPills.push({
              key: 'telefono',
              label: filters.telefono === 'con' ? 'Con Celular' : 'Sin Celular',
              onClear: () => { setFilters((f) => ({ ...f, telefono: 'todos' })); setCurrentPage(1); }
            });
          }

          return (
            <div className="space-y-4">
              {/* Encabezado del Censo y Botones de Reporte */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#0080FF]" /> Censo y Banco de Hojas de Vida
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {liveVoters.length} simpatizantes registrados en Turbo • {profCount} profesionales con hoja de vida
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Botón de Filtros para Móviles */}
                  <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden px-3 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Filter className="w-4 h-4 text-[#0080FF]" />
                    <span>Filtros {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
                  </button>

                  {/* Botón para alternar Sidebar en PC */}
                  <button
                    onClick={() => setSidebarOpen((v) => !v)}
                    className="hidden lg:flex px-3 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-bold items-center gap-1.5 transition"
                    title={sidebarOpen ? 'Ocultar panel lateral de filtros' : 'Mostrar panel lateral de filtros'}
                  >
                    <SlidersHorizontal className="w-4 h-4 text-[#0080FF]" />
                    <span>{sidebarOpen ? 'Ocultar Filtros' : `Mostrar Filtros ${activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}`}</span>
                  </button>

                  <button
                    onClick={() => setPdfModalOpen(true)}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 active:scale-95 text-[#001E72] rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition border border-blue-200 shadow-xs"
                    title="Ver reporte oficial listo para imprimir o guardar en PDF"
                  >
                    <Printer className="w-4 h-4 text-[#0080FF]" />
                    <span>Reporte PDF</span>
                  </button>

                  <button
                    onClick={exportToExcel}
                    className="px-3 py-2 bg-[#3FBC24] hover:bg-[#349e1e] active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition shadow-xs"
                    title="Descargar censo completo en formato Excel"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Excel</span>
                  </button>
                </div>
              </div>

              {/* 
                ========================================================================
                DISTRIBUCIÓN 2 COLUMNAS ESTILO ARISTÓTELES (SIDEBAR DE FILTROS + TABLA CRUD)
                ========================================================================
              */}
              <div className="flex flex-col lg:flex-row items-start gap-4">
                {/* 1. SIDEBAR DE FILTROS EN PC (STICKY) */}
                {sidebarOpen && (
                  <aside className="hidden lg:block w-80 shrink-0 sticky top-20 animate-fade-in">
                    <VoterFilterSidebar
                      filters={filters}
                      onChange={(newFilters) => {
                        setFilters(newFilters);
                        setCurrentPage(1);
                      }}
                      totalMatches={filteredVoters.length}
                      totalVoters={liveVoters.length}
                      availableProfessions={availableProfessions}
                      systemUsers={systemUsers}
                      territory={territory}
                      onCollapsePc={() => setSidebarOpen(false)}
                    />
                  </aside>
                )}

                {/* 2. MODAL DRAWER DE FILTROS EN MÓVILES */}
                {mobileFiltersOpen && (
                  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in lg:hidden">
                    <div className="absolute inset-0" onClick={() => setMobileFiltersOpen(false)} />
                    <div className="relative w-full max-w-lg z-10 animate-slide-up">
                      <VoterFilterSidebar
                        filters={filters}
                        onChange={(newFilters) => {
                          setFilters(newFilters);
                          setCurrentPage(1);
                        }}
                        totalMatches={filteredVoters.length}
                        totalVoters={liveVoters.length}
                        availableProfessions={availableProfessions}
                        systemUsers={systemUsers}
                        territory={territory}
                        onCloseMobile={() => setMobileFiltersOpen(false)}
                        isMobileModal={true}
                      />
                    </div>
                  </div>
                )}

                {/* 3. CONTENIDO CENTRAL: TABLA CRUD Y PAGINACIÓN */}
                <div className="flex-1 min-w-0 w-full space-y-3">
                  {/* Barra de Controles: Switch de Vista y Conteo */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0">
                        <button
                          onClick={() => setVoterViewMode('tabla')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            voterViewMode === 'tabla'
                              ? 'bg-[#001E72] text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span>📊 Modo CRUD</span>
                        </button>
                        <button
                          onClick={() => setVoterViewMode('tarjetas')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            voterViewMode === 'tarjetas'
                              ? 'bg-[#001E72] text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span>📱 Fichas</span>
                        </button>
                      </div>

                      <span className="text-xs font-bold text-slate-700">
                        {totalMatches} personas filtradas
                      </span>
                    </div>

                    {/* Selector de Paginación Rápida */}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Página <strong>{safeCurrentPage}</strong> de <strong>{totalPages}</strong></span>
                    </div>
                  </div>

                  {/* Pastillas de Filtros Activos (Clicables para Quitar) */}
                  {activeFilterPills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-blue-50/60 rounded-xl border border-blue-100 animate-fade-in">
                      <span className="text-[11px] font-black uppercase text-[#001E72] mr-1">Filtros:</span>
                      {activeFilterPills.map((pill) => (
                        <button
                          key={pill.key}
                          type="button"
                          onClick={pill.onClear}
                          className="inline-flex items-center gap-1 text-[11px] font-bold bg-white text-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 hover:border-red-300 hover:text-red-600 shadow-2xs transition"
                          title="Clic para remover este filtro"
                        >
                          <span>{pill.label}</span>
                          <X className="w-3 h-3 text-slate-400 group-hover:text-red-500" />
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setFilters(initialFilterState);
                          setCurrentPage(1);
                        }}
                        className="text-[11px] font-bold text-red-600 hover:underline ml-1"
                      >
                        Limpiar todos
                      </button>
                    </div>
                  )}

                  {/* VISTA 1: TABLA CRUD PROFESIONAL ESTILO ARISTÓTELES (PAGINADA) */}
                  {voterViewMode === 'tabla' && (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
                        <span>💡 Haz clic sobre cualquier fila para abrir el <strong>Expediente Lateral (Aristóteles)</strong>.</span>
                        <span className="font-mono text-[11px] font-bold text-slate-700">
                          {paginatedVoters.length} en pantalla
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#001E72] text-white uppercase font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-3 w-8 text-center">#</th>
                              <th className="p-3">Cédula</th>
                              <th className="p-3">Nombre Completo</th>
                              <th className="p-3">Teléfono</th>
                              <th className="p-3">Barrio / Vereda</th>
                              <th className="p-3">Nivel de Estudio</th>
                              <th className="p-3">Profesión u Oficio</th>
                              <th className="p-3 text-center">Estado</th>
                              <th className="p-3 text-right">Expediente</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {paginatedVoters.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="p-8 text-center text-slate-400">
                                  No se encontraron simpatizantes con los filtros seleccionados.
                                </td>
                              </tr>
                            ) : (
                              paginatedVoters.map((v, idx) => {
                                const isSelected = selectedVoter?.id === v.id;
                                const formattedName = formatTitleCase(v.nombre_completo);
                                const initials = formattedName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase();

                                return (
                                  <tr
                                    key={v.id || idx}
                                    onClick={() => {
                                      setSelectedVoter(v);
                                      setInspectorOpen(true);
                                    }}
                                    className={`transition cursor-pointer select-none ${
                                      isSelected
                                        ? 'bg-blue-50/90 ring-1 ring-[#0080FF]'
                                        : 'hover:bg-slate-50/90'
                                    }`}
                                  >
                                    <td className="p-3 text-center font-mono text-slate-400 font-bold">
                                      {startIndex + idx + 1}
                                    </td>
                                    <td className="p-3 font-mono font-bold text-slate-900">
                                      {v.documento}
                                    </td>
                                    <td className="p-3 font-bold text-slate-900">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-[#001E72] text-white flex items-center justify-center font-black text-[9px] shrink-0">
                                          {initials}
                                        </div>
                                        <span className="truncate">{formattedName}</span>
                                      </div>
                                    </td>
                                    <td className="p-3 text-slate-800 font-mono">
                                      <a
                                        href={`tel:${v.telefono}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="hover:text-[#0080FF] inline-flex items-center gap-1 font-semibold"
                                      >
                                        <Phone className="w-3 h-3 text-[#0080FF]" /> {v.telefono}
                                      </a>
                                    </td>
                                    <td className="p-3 text-slate-600">
                                      {v.barrio_nombre || v.vereda_nombre || (v.barrio_id ? `Barrio ${v.barrio_id}` : 'Turbo')}
                                    </td>
                                    <td className="p-3 capitalize text-slate-600 font-medium">
                                      {v.estudio_realizado || 'Bachiller'}
                                    </td>
                                    <td className="p-3">
                                      {v.profesion ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#0080FF] font-bold rounded-md border border-blue-200 text-[11px]">
                                          <Briefcase className="w-3 h-3 shrink-0" /> {formatTitleCase(v.profesion)}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 italic text-[11px]">—</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-center">
                                      {v._synced !== false ? (
                                        <span className="text-[10px] text-[#166534] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                                          En Nube
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-[#854d0e] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-bold">
                                          En Celular
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingVoter(v);
                                          }}
                                          className="px-2.5 py-1.5 bg-[#0080FF] hover:bg-[#0070e0] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition"
                                          title="Editar teléfono o datos de este votante"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                          <span>Editar</span>
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedVoter(v);
                                            setInspectorOpen(true);
                                          }}
                                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
                                          title="Ver expediente lateral estilo Aristóteles"
                                        >
                                          <span>Ficha</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* VISTA 2: FICHAS MÓVILES (PAGINADAS) */}
                  {voterViewMode === 'tarjetas' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {paginatedVoters.length === 0 ? (
                        <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
                          No se encontraron simpatizantes con los filtros seleccionados.
                        </div>
                      ) : (
                        paginatedVoters.map((v) => {
                          const formattedName = formatTitleCase(v.nombre_completo);
                          const initials = formattedName
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
                              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition space-y-3"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-[#001E72] text-white flex items-center justify-center font-black text-sm shadow-md shrink-0 border-b-2 border-[#F4BD21]">
                                  {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-slate-900 text-sm truncate">{formattedName}</h4>
                                  <p className="text-xs text-slate-500 font-mono">CC: {v.documento}</p>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                      📍 {v.barrio_nombre || v.vereda_nombre || (v.barrio_id ? `Barrio ${v.barrio_id}` : 'Turbo')}
                                    </span>
                                    {v.profesion && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#0080FF] border border-blue-100">
                                        💼 {formatTitleCase(v.profesion)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`tel:${v.telefono}`}
                                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                                  >
                                    <Phone className="w-3.5 h-3.5 text-[#0080FF]" />
                                    <span>Llamar</span>
                                  </a>
                                  <a
                                    href={`https://api.whatsapp.com/send?phone=${telWhatsApp}&text=${encodeURIComponent(
                                      `Hola ${formattedName}, te saludamos de la campaña de Janier Lloreda (SOMOS NUEVAS ACCIONES).`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-2 px-3 rounded-xl bg-[#3FBC24]/15 hover:bg-[#3FBC24]/25 text-[#2f961a] font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>WhatsApp</span>
                                  </a>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setEditingVoter(v)}
                                    className="flex-1 py-2 px-3 rounded-xl bg-[#0080FF] hover:bg-[#0070e0] text-white font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>Editar Teléfono</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedVoter(v);
                                      setInspectorOpen(true);
                                    }}
                                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center transition"
                                  >
                                    <span>Ficha →</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* BARRA DE PAGINACIÓN ESTILO ARISTÓTELES */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
                    <div className="flex items-center gap-3 text-slate-500 font-semibold">
                      <span>
                        Mostrando <strong className="text-slate-900">{totalMatches === 0 ? 0 : startIndex + 1}</strong> a{' '}
                        <strong className="text-slate-900">{endIndex}</strong> de{' '}
                        <strong className="text-slate-900">{totalMatches}</strong> simpatizantes
                      </span>

                      <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                        <span className="text-slate-400">Ver:</span>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 focus:outline-none"
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={safeCurrentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Anterior</span>
                      </button>

                      <span className="px-2 font-mono font-bold text-slate-700">
                        {safeCurrentPage} / {totalPages}
                      </span>

                      <button
                        type="button"
                        disabled={safeCurrentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
                      >
                        <span>Siguiente</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
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
                      <option value="lider_junta_directiva">Líder de Junta Directiva</option>
                      <option value="lider_equipo_operativo">Líder de Equipo Operativo</option>
                      <option value="secretaria">Secretaria de Equipo Operativo</option>
                      <option value="coordinador">Coordinador General</option>
                      <option value="secretaria_general">Secretaria General</option>
                      {/* BLINDADO: Solo Janier Lloreda (Gerente General) puede ver y asignar Gerente General */}
                      {currentUser.rol === 'gerente_general' && (
                        <option value="gerente_general">Gerente General (Admin)</option>
                      )}
                    </select>
                  </div>

                  {['secretaria', 'lider_junta_directiva', 'lider_equipo_operativo'].includes(newRol) && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        {newRol === 'lider_junta_directiva' ? 'Junta Directiva Asignada (1 a 20)' : 'Equipo Operativo Asignado'}
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
        onVoterAdded={handleInternalVoterAdded}
      />

      {/* Modal Reporte en PDF Oficial (Volteable en Horizontal en Celulares) */}
      <ReportPdfModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        voters={liveVoters}
        currentUser={currentUser}
        onExportExcel={exportToExcel}
      />

      {/* Inspector Lateral de Simpatizante (Estilo Aristotle Contacts Inspector con Edición) */}
      <ContactInspectorDrawer
        voter={selectedVoter}
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        onVoterUpdated={(updated) => {
          setLiveVoters((prev) =>
            prev.map((v) => (v.id === updated.id || v.documento === updated.documento ? { ...v, ...updated } : v))
          );
          setSelectedVoter(updated);
        }}
      />

      {/* Modal Directo de Edición de Votante (Modificar Teléfono / Perfil) */}
      <EditVoterModal
        voter={editingVoter}
        isOpen={!!editingVoter}
        onClose={() => setEditingVoter(null)}
        onVoterUpdated={(updated) => {
          setLiveVoters((prev) =>
            prev.map((v) => (v.id === updated.id || v.documento === updated.documento ? { ...v, ...updated } : v))
          );
          if (selectedVoter?.id === updated.id || selectedVoter?.documento === updated.documento) {
            setSelectedVoter(updated);
          }
        }}
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
          {liveVoters.length > 0 && (
            <span className="absolute top-0 right-1 bg-[#3FBC24] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
              {liveVoters.length}
            </span>
          )}
        </button>
      </nav>
    </div>
  );
}
