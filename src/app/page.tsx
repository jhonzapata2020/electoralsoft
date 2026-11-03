'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { UsuarioSistema, Votante } from '../types';
import { getCurrentUser, setCurrentUser, syncTerritoryCache, getLocalVoters } from '../lib/offline-sync';
import { supabase } from '../lib/supabase';
import AuthScreen from '../components/AuthScreen';
import LeaderDashboard from '../components/LeaderDashboard';
import SecretaryDashboard from '../components/SecretaryDashboard';
import WarRoomDashboard from '../components/WarRoomDashboard';

export default function HomePage() {
  const [currentUser, setLocalCurrentUser] = useState<UsuarioSistema | null>(null);
  const [voters, setVoters] = useState<Votante[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // 1. Cargar sesión local
    const saved = getCurrentUser();
    if (saved) {
      setLocalCurrentUser(saved);
    }

    // 2. Precargar catálogo de territorio
    syncTerritoryCache();

    // 3. Cargar votantes locales
    const localList = getLocalVoters();
    setVoters(localList);

    // 4. Cargar votantes remotos en segundo plano
    const fetchRemote = async () => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          const res = await fetch('/api/voters');
          if (res.ok) {
            const data = await res.json();
            const remoteList = data as Votante[];
            const map = new Map<string, Votante>();
            remoteList.forEach((rv) => map.set(rv.documento, { ...rv, _synced: true }));
            localList.forEach((lv) => {
              if (!map.has(lv.documento)) {
                map.set(lv.documento, lv);
              }
            });
            setVoters(Array.from(map.values()));
          }
        } catch (err) {
          console.warn('API fetch background', err);
        }
      }
    };

    fetchRemote();
  }, []);

  // Suscripción Realtime
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('realtime_votantes_home')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votantes' },
        (payload) => {
          const newVoter = payload.new as Votante;
          setVoters((prev) => {
            if (prev.some((v) => v.documento === newVoter.documento)) {
              return prev.map((v) => (v.documento === newVoter.documento ? { ...newVoter, _synced: true } : v));
            }
            return [{ ...newVoter, _synced: true }, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const handleLogin = (user: UsuarioSistema) => {
    setLocalCurrentUser(user);
    setCurrentUser(user);
    // Sincronizar censo de inmediato al iniciar sesión
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      fetch('/api/voters')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setVoters(data as Votante[]);
          }
        })
        .catch((e) => console.warn(e));
    }
  };

  const handleLogout = () => {
    setLocalCurrentUser(null);
    setCurrentUser(null);
  };

  const handleVoterAdded = (newVoter: Votante) => {
    setVoters((prev) => {
      const filtered = prev.filter((v) => v.documento !== newVoter.documento);
      return [newVoter, ...filtered];
    });
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#050a17] flex items-center justify-center text-slate-500">
        <div className="w-6 h-6 border-2 border-[#0080FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Sin sesión -> Login directo e instantáneo
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLogin} />;
  }

  // 2. Rol Gerente General / Coordinador / Secretaria General -> War Room
  if (['gerente_general', 'coordinador', 'secretaria_general'].includes(currentUser.rol)) {
    return (
      <WarRoomDashboard
        currentUser={currentUser}
        allVoters={voters}
        onLogout={handleLogout}
        onVoterAdded={handleVoterAdded}
      />
    );
  }

  // 3. Rol Secretaria -> Panel de su Junta / Equipo Operativo
  if (currentUser.rol === 'secretaria') {
    return (
      <SecretaryDashboard
        currentUser={currentUser}
        onLogout={handleLogout}
        onVoterAdded={handleVoterAdded}
      />
    );
  }

  // 4. Roles de Campo (Líderes) -> Panel de Líder
  return (
    <LeaderDashboard
      currentUser={currentUser}
      voters={voters}
      onLogout={handleLogout}
      onVoterAdded={handleVoterAdded}
    />
  );
}
