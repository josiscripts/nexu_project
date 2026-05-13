'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/contexts/SocketContext';
import { getMyRooms, createRoom, deleteRoom } from '@/services/user.service';
import type { RoomInfo } from '@/services/user.service';
import Navbar from '@/components/layout/Navbar';
import AudioRoom from '@/components/audio/AudioRoom';
import { Loader2, Plus, Radio, Trash2 } from 'lucide-react';

const UNESCO_AREAS = [
  'SALUD',
  'INGENIERIA',
  'ARTES',
  'CIENCIAS_EXACTAS',
  'CIENCIAS_SOCIALES',
  'NEGOCIOS',
  'ARQUITECTURA_Y_URBANISMO',
] as const;

interface RoomWithCreator extends RoomInfo {
  isCreator?: boolean;
}

export default function SalasPage() {
  const searchParams = useSearchParams();
  const { token, user } = useAuthStore();
  const { socket } = useSocket();
  const [myRooms, setMyRooms] = useState<RoomWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [area, setArea] = useState<(typeof UNESCO_AREAS)[number]>('INGENIERIA');
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedRoomName, setSelectedRoomName] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMyRooms = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await getMyRooms(token);
      // Add isCreator field based on hostId
      const roomsWithCreator = data.map(room => ({
        ...room,
        isCreator: (room as any).hostId === user?.id,
      }));
      setMyRooms(roomsWithCreator);
    } catch (err) {
      console.error('Error loading my rooms:', err);
      setError('Error al cargar salas');
    } finally {
      setIsLoading(false);
    }
  }, [token, user?.id]);

  useEffect(() => {
    loadMyRooms();
    const interval = setInterval(loadMyRooms, 5000);
    return () => clearInterval(interval);
  }, [loadMyRooms]);

  useEffect(() => {
    if (!socket) return;

    const handleRoomUpdate = () => {
      loadMyRooms();
    };

    socket.on('room:user-joined', handleRoomUpdate);
    socket.on('room:user-left', handleRoomUpdate);
    socket.on('room:destroyed', handleRoomUpdate);
    socket.on('room:created', handleRoomUpdate);
    socket.on('room:list-update', handleRoomUpdate);

    return () => {
      socket.off('room:user-joined', handleRoomUpdate);
      socket.off('room:user-left', handleRoomUpdate);
      socket.off('room:destroyed', handleRoomUpdate);
      socket.off('room:created', handleRoomUpdate);
      socket.off('room:list-update', handleRoomUpdate);
    };
  }, [socket, loadMyRooms]);

  // Handle ?selected parameter from Explore page
  useEffect(() => {
    const selectedParam = searchParams.get('selected');
    if (selectedParam && myRooms.length > 0) {
      const room = myRooms.find(r => r.id === selectedParam);
      if (room) {
        setSelectedRoom(room.id);
        setSelectedRoomName(room.name);
      }
    }
  }, [searchParams, myRooms]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const newRoom = await createRoom({ name, area }, token);
      setSelectedRoom(newRoom.id);
      setSelectedRoomName(newRoom.name);
      setName('');
      setArea('INGENIERIA');
      setShowForm(false);
      alert('Sala creada exitosamente');
      await loadMyRooms();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear sala';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinRoom = (roomId: string, roomName: string) => {
    setSelectedRoom(roomId);
    setSelectedRoomName(roomName);
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!token) return;

    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar permanentemente la sala "${roomName}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteRoom(roomId, token);
      alert('Sala eliminada correctamente');
      setSelectedRoom(null);
      await loadMyRooms();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar sala';
      alert(errorMsg);
      console.error('Delete room error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (selectedRoom) {
    const currentRoom = myRooms.find(r => r.id === selectedRoom);
    const isRoomCreator = currentRoom?.isCreator;

    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setSelectedRoom(null)}
              className="px-4 py-2 bg-gray-300 text-brand-navy rounded-lg font-bold hover:bg-gray-400 transition"
            >
              ← Volver
            </button>
            {isRoomCreator && (
              <button
                onClick={() => handleDeleteRoom(selectedRoom, selectedRoomName || 'Sala')}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Sala
              </button>
            )}
          </div>
          <AudioRoom roomId={selectedRoom} roomName={selectedRoomName || 'Sala'} onLeave={() => setSelectedRoom(null)} />
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

          {/* Lista de mis salas */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
            </div>
          ) : myRooms.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-brand-navy">Mis Salas</h2>
              {myRooms.map((room) => (
                <div
                  key={room.id}
                  className="p-4 bg-gray-50 border-l-4 border-green-500 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-brand-navy text-lg flex items-center gap-2">
                          <Radio className="w-4 h-4 text-green-500 animate-pulse" />
                          {room.name}
                        </h3>
                        {room.isCreator && (
                          <span className="text-xs bg-brand-red text-white px-2 py-1 rounded">
                            Creador
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>{room.area?.replace(/_/g, ' ')}</span>
                        <span className="font-bold text-green-600">
                          {room.userCount} usuario{room.userCount !== 1 ? 's' : ''} activo{room.userCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => handleJoinRoom(room.id, room.name)}
                        className="px-4 py-2 bg-brand-red text-white rounded-lg font-bold hover:bg-red-700 transition whitespace-nowrap"
                      >
                        Entrar
                      </button>
                      {room.isCreator && (
                        <button
                          onClick={() => handleDeleteRoom(room.id, room.name)}
                          disabled={isDeleting}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                          title="Eliminar sala"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">No tienes salas aún. Crea una o únete a través de Explorar</p>
          )}
        </div>
      </main>
    </div>
  );
}
