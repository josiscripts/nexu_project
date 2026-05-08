'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/contexts/SocketContext';
import { getRooms, createRoom } from '@/services/user.service';
import type { RoomInfo } from '@/services/user.service';
import Navbar from '@/components/layout/Navbar';
import AudioRoom from '@/components/audio/AudioRoom';
import { Loader2, Plus, Radio } from 'lucide-react';

const UNESCO_AREAS = [
  'SALUD',
  'INGENIERIA',
  'ARTES',
  'CIENCIAS_EXACTAS',
  'CIENCIAS_SOCIALES',
  'NEGOCIOS',
  'ARQUITECTURA_Y_URBANISMO',
] as const;

export default function SalasPage() {
  const { token } = useAuthStore();
  const { socket } = useSocket();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [area, setArea] = useState<(typeof UNESCO_AREAS)[number]>('INGENIERIA');
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const loadRooms = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await getRooms(token);
      setRooms(data.filter(r => r.userCount > 0));
    } catch (err) {
      console.error('Error loading rooms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 5000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    const handleRoomUpdate = () => {
      loadRooms();
    };

    socket.on('room:user-joined', handleRoomUpdate);
    socket.on('room:user-left', handleRoomUpdate);
    socket.on('room:destroyed', handleRoomUpdate);

    return () => {
      socket.off('room:user-joined', handleRoomUpdate);
      socket.off('room:user-left', handleRoomUpdate);
      socket.off('room:destroyed', handleRoomUpdate);
    };
  }, [socket]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const newRoom = await createRoom({ name, area }, token);
      setSelectedRoom(newRoom.id);
      setName('');
      setArea('INGENIERIA');
      setShowForm(false);
      alert('Sala creada exitosamente');
      await loadRooms();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear sala';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleJoinRoom = (roomId: string) => {
    setSelectedRoom(roomId);
  };

  if (selectedRoom) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="p-4 sm:p-6 lg:p-8">
          <button
            onClick={() => setSelectedRoom(null)}
            className="mb-4 px-4 py-2 bg-gray-300 text-brand-navy rounded-lg font-bold hover:bg-gray-400 transition"
          >
            ← Volver
          </button>
          <AudioRoom roomId={selectedRoom} onLeave={() => setSelectedRoom(null)} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Botón crear sala */}
          <div className="mb-6">
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full px-4 py-3 bg-brand-red text-white rounded-lg font-bold hover:bg-red-700 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Crear Sala
            </button>
          </div>

          {/* Formulario crear sala */}
          {showForm && (
            <form
              onSubmit={handleCreateRoom}
              className="p-4 bg-gray-50 border-2 border-brand-red rounded-lg mb-6 space-y-4"
            >
              {error && (
                <p className="text-red-600 bg-red-100 p-2 rounded text-sm">{error}</p>
              )}

              <div>
                <label className="block text-sm font-bold text-brand-navy mb-1">
                  Nombre de la sala
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Estudio de Matemáticas"
                  maxLength={100}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-brand-red disabled:opacity-50"
                  required
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

          {/* Lista de salas activas */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
            </div>
          ) : rooms.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-brand-navy">Salas Activas</h2>
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="p-4 bg-gray-50 border-l-4 border-green-500 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-brand-navy text-lg flex items-center gap-2">
                        <Radio className="w-4 h-4 text-green-500 animate-pulse" />
                        {room.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>{room.area?.replace(/_/g, ' ')}</span>
                        <span className="font-bold text-green-600">
                          {room.userCount} usuario{room.userCount !== 1 ? 's' : ''} activo{room.userCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinRoom(room.id)}
                      className="px-4 py-2 bg-brand-red text-white rounded-lg font-bold hover:bg-red-700 transition whitespace-nowrap ml-2"
                    >
                      Entrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">No hay salas activas en este momento</p>
          )}
        </div>
      </main>
    </div>
  );
}
