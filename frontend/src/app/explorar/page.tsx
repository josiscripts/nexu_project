'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/contexts/SocketContext';
import { searchAll, toggleFollow, getRooms, joinGroup, leaveGroup, joinRoom } from '@/services/user.service';
import type { SearchResults, RoomInfo } from '@/services/user.service';
import Navbar from '@/components/layout/Navbar';
import { Loader2, Users, Radio, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ExplorePage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { socket } = useSocket();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState<'todo' | 'usuarios' | 'grupos' | 'salas'>('todo');
  const [followingMap, setFollowingMap] = useState<Set<string>>(new Set());

  const loadRooms = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getRooms(token);
      setRooms(data.filter(r => r.userCount > 0));
    } catch (err) {
      console.error('Error loading rooms:', err);
    }
  }, [token]);

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 5000);
    return () => clearInterval(interval);
  }, [loadRooms]);

  const handleSearch = useCallback(async () => {
    if (!q.trim() || !token) return;
    setIsLoading(true);
    try {
      const data = await searchAll(q, token);
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [q, token]);

  useEffect(() => {
    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
  }, [q, handleSearch]);

  useEffect(() => {
    if (!socket) return;

    const handleGroupUpdate = () => {
      handleSearch();
    };

    const handleRoomUpdate = () => {
      loadRooms();
    };

    socket.on('group:created', handleGroupUpdate);
    socket.on('group:user-joined', handleGroupUpdate);
    socket.on('group:user-left', handleGroupUpdate);
    socket.on('room:user-joined', handleRoomUpdate);
    socket.on('room:user-left', handleRoomUpdate);
    socket.on('room:destroyed', handleRoomUpdate);

    return () => {
      socket.off('group:created', handleGroupUpdate);
      socket.off('group:user-joined', handleGroupUpdate);
      socket.off('group:user-left', handleGroupUpdate);
      socket.off('room:user-joined', handleRoomUpdate);
      socket.off('room:user-left', handleRoomUpdate);
      socket.off('room:destroyed', handleRoomUpdate);
    };
  }, [socket, handleSearch, loadRooms]);

  const handleToggleFollow = async (userId: string) => {
    if (!token) return;
    try {
      const res = await toggleFollow(userId, token);
      setFollowingMap(prev => {
        const next = new Set(prev);
        if (res.following) {
          next.add(userId);
          alert('Ahora estás siguiendo a este usuario');
        } else {
          next.delete(userId);
          alert('Has dejado de seguir a este usuario');
        }
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al seguir usuario';
      alert(message);
      console.error('Follow error:', err);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!token) return;
    try {
      await joinGroup(groupId, token);
      alert('Te has unido al grupo correctamente');
      const data = await searchAll(q, token);
      setResults(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al unirse al grupo';
      alert(message);
      console.error('Join group error:', err);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!token) return;
    if (!confirm('¿Estás seguro de que quieres salir de este grupo?')) return;

    try {
      await leaveGroup(groupId, token);
      alert('Has salido del grupo correctamente');
      const data = await searchAll(q, token);
      setResults(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al salir del grupo';
      alert(message);
      console.error('Leave group error:', err);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    if (!token) return;

    try {
      await joinRoom(roomId, token);
      // Navigate to room without reloading (client-side navigation)
      router.push(`/salas?selected=${roomId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al unirse a la sala';
      alert(message);
      console.error('Join room error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Búsqueda */}
          <div className="mb-6">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar usuarios, grupos, salas..."
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-brand-red transition"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {['todo', 'usuarios', 'grupos', 'salas'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t as any)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap',
                  tab === t
                    ? 'bg-brand-red text-white'
                    : 'bg-gray-200 text-brand-navy hover:bg-gray-300'
                )}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
            </div>
          )}

          {/* Resultados de búsqueda */}
          {!isLoading && results && q.trim() && (
            <div className="space-y-6">
              {/* Usuarios */}
              {(tab === 'todo' || tab === 'usuarios') && results.users.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-brand-navy mb-3">Usuarios</h2>
                  <div className="grid gap-3">
                    {results.users.map((u) => (
                      <div
                        key={u.id}
                        className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <h3 className="font-bold text-brand-navy">{u.name}</h3>
                          <p className="text-sm text-gray-600">{u.area?.replace(/_/g, ' ')}</p>
                        </div>
                        <button
                          onClick={() => handleToggleFollow(u.id)}
                          className={cn(
                            'px-4 py-2 rounded-lg font-medium transition',
                            followingMap.has(u.id)
                              ? 'bg-gray-300 text-brand-navy hover:bg-gray-400'
                              : 'bg-brand-red text-white hover:bg-red-700'
                          )}
                        >
                          {followingMap.has(u.id) ? 'Siguiendo' : 'Seguir'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grupos */}
              {(tab === 'todo' || tab === 'grupos') && results.groups.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-brand-navy mb-3">Grupos</h2>
                  <div className="grid gap-3">
                    {results.groups.map((g) => (
                      <div
                        key={g.id}
                        className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <h3 className="font-bold text-brand-navy">{g.name}</h3>
                          <p className="text-sm text-gray-600">{g.area?.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {g._count.members} miembros
                          </p>
                        </div>
                        {g.isMember ? (
                          <button onClick={() => handleLeaveGroup(g.id)} className="px-4 py-2 rounded-lg font-medium bg-gray-400 text-white hover:bg-gray-500 transition flex items-center gap-2">
                            <LogOut className="w-4 h-4" />
                            Salir
                          </button>
                        ) : (
                          <button onClick={() => handleJoinGroup(g.id)} className="px-4 py-2 rounded-lg font-medium bg-brand-red text-white hover:bg-red-700 transition">
                            Unirse
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Salas */}
              {(tab === 'todo' || tab === 'salas') && results.rooms.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-brand-navy mb-3">Salas Activas</h2>
                  <div className="grid gap-3">
                    {results.rooms.map((r) => (
                      <div
                        key={r.id}
                        className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <h3 className="font-bold text-brand-navy flex items-center gap-2">
                            <Radio className="w-4 h-4 text-green-500" /> {r.name}
                          </h3>
                          <p className="text-sm text-gray-600">{r.area?.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-gray-500 mt-1">{r.userCount} usuario{r.userCount !== 1 ? 's' : ''} activo{r.userCount !== 1 ? 's' : ''}</p>
                        </div>
                        <button onClick={() => handleJoinRoom(r.id)} className="px-4 py-2 rounded-lg font-medium bg-brand-red text-white hover:bg-red-700 transition">
                          Unirse
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sin resultados */}
              {results.users.length === 0 && results.groups.length === 0 && results.rooms.length === 0 && (
                <p className="text-center text-gray-500 py-8">Sin resultados para "{q}"</p>
              )}
            </div>
          )}

          {/* Pantalla inicial o salas cuando no hay búsqueda */}
          {!q.trim() && !isLoading && (
            <div>
              {results === null && (
                <p className="text-center text-gray-500 py-8">Comienza a buscar usuarios, grupos o salas...</p>
              )}
              {results !== null && (
                <>
                  <h2 className="text-lg font-bold text-brand-navy mb-3">Salas Activas</h2>
                  {rooms.length > 0 ? (
                    <div className="grid gap-3">
                      {rooms.map((r) => (
                        <div
                          key={r.id}
                          className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <h3 className="font-bold text-brand-navy flex items-center gap-2">
                              <Radio className="w-4 h-4 text-green-500" /> {r.name}
                            </h3>
                            <p className="text-sm text-gray-600">{r.area?.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-gray-500 mt-1">{r.userCount} usuario{r.userCount !== 1 ? 's' : ''}</p>
                          </div>
                          <button onClick={() => handleJoinRoom(r.id)} className="px-4 py-2 rounded-lg font-medium bg-brand-red text-white hover:bg-red-700 transition">
                            Unirse
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No hay salas activas</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
