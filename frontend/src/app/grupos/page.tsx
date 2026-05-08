'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/contexts/SocketContext';
import { getGroups, createGroup, joinGroup, leaveGroup } from '@/services/user.service';
import type { GroupCard } from '@/services/user.service';
import Navbar from '@/components/layout/Navbar';
import { Loader2, Plus, Users, LogOut } from 'lucide-react';

const UNESCO_AREAS = [
  'SALUD',
  'INGENIERIA',
  'ARTES',
  'CIENCIAS_EXACTAS',
  'CIENCIAS_SOCIALES',
  'NEGOCIOS',
  'ARQUITECTURA_Y_URBANISMO',
] as const;

export default function GruposPage() {
  const { token } = useAuthStore();
  const { socket } = useSocket();
  const [groups, setGroups] = useState<GroupCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState<(typeof UNESCO_AREAS)[number]>('INGENIERIA');
  const [error, setError] = useState<string | null>(null);

  const loadGroups = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await getGroups(token);
      setGroups(data);
    } catch (err) {
      console.error('Error loading groups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    const handleGroupUpdate = () => {
      loadGroups();
    };

    socket.on('group:created', handleGroupUpdate);
    socket.on('group:user-joined', handleGroupUpdate);
    socket.on('group:user-left', handleGroupUpdate);

    return () => {
      socket.off('group:created', handleGroupUpdate);
      socket.off('group:user-joined', handleGroupUpdate);
      socket.off('group:user-left', handleGroupUpdate);
    };
  }, [socket]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const newGroup = await createGroup({ name, description, area }, token);
      setGroups([newGroup, ...groups]);
      setName('');
      setDescription('');
      setArea('INGENIERIA');
      setShowForm(false);
      alert('Grupo creado exitosamente');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear grupo';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!token) return;
    try {
      await joinGroup(groupId, token);
      alert('Te has unido al grupo correctamente');
      await loadGroups();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al unirse al grupo';
      alert(message);
      console.error('Error joining group:', err);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!token) return;
    if (!confirm('¿Estás seguro de que quieres salir de este grupo?')) return;

    try {
      await leaveGroup(groupId, token);
      alert('Has salido del grupo correctamente');
      await loadGroups();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al salir del grupo';
      alert(message);
      console.error('Error leaving group:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Botón crear grupo */}
          <div className="mb-6">
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full px-4 py-3 bg-brand-red text-white rounded-lg font-bold hover:bg-red-700 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Crear Grupo
            </button>
          </div>

          {/* Formulario crear grupo */}
          {showForm && (
            <form
              onSubmit={handleCreateGroup}
              className="p-4 bg-gray-50 border-2 border-brand-red rounded-lg mb-6 space-y-4"
            >
              {error && (
                <p className="text-red-600 bg-red-100 p-2 rounded text-sm">{error}</p>
              )}

              <div>
                <label className="block text-sm font-bold text-brand-navy mb-1">
                  Nombre del grupo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Estudio de Programación"
                  maxLength={100}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-brand-red disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-navy mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el propósito del grupo..."
                  maxLength={300}
                  rows={3}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-brand-red disabled:opacity-50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-navy mb-1">
                  Área de conocimiento
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value as any)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:border-brand-red disabled:opacity-50"
                >
                  {UNESCO_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="flex-1 px-4 py-2 bg-brand-red text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-brand-navy rounded-lg font-bold hover:bg-gray-400 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Lista de grupos */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
            </div>
          ) : groups.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-brand-navy">Grupos disponibles</h2>
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 bg-gray-50 border-l-4 border-brand-red rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-brand-navy text-lg">{group.name}</h3>
                      {group.description && (
                        <p className="text-sm text-gray-700 mt-1">{group.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>{group.area?.replace(/_/g, ' ')}</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {group._count.members} miembro{group._count.members !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    {group.isMember ? (
                      <button
                        onClick={() => handleLeaveGroup(group.id)}
                        className="px-4 py-2 bg-gray-400 text-white rounded-lg font-bold hover:bg-gray-500 transition whitespace-nowrap ml-2 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Salir
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinGroup(group.id)}
                        className="px-4 py-2 bg-brand-red text-white rounded-lg font-bold hover:bg-red-700 transition whitespace-nowrap ml-2"
                      >
                        Unirse
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">No hay grupos disponibles</p>
          )}
        </div>
      </main>
    </div>
  );
}
